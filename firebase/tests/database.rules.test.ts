/// <reference types="node" />
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {setLogLevel} from 'firebase/app';
import {get, ref, set} from 'firebase/database';

// Denied writes are the point of these tests; keep the SDK's permission_denied warnings out of the output.
setLogLevel('error');

const MIN = 60 * 1000;
const STUDENT = 'student-uuid';
const LECTURER = 'lecturer-uuid';
const OTHER = 'other-student-uuid';

let env: RulesTestEnvironment;

const student = () => env.authenticatedContext(STUDENT, {role: 'STUDENT'});
const lecturer = () => env.authenticatedContext(LECTURER, {role: 'LECTURER'});
const other = () => env.authenticatedContext(OTHER, {role: 'STUDENT'});

const position = (extra: Record<string, unknown> = {}) => ({
  building: 'B11',
  x: 12.5,
  z: -40,
  acc: 8,
  updatedAt: Date.now(),
  ...extra,
});

// Same shape the backend writes (ActiveBookingProjection).
async function seedBooking(startOffset: number, endOffset: number, id = 'b1') {
  const now = Date.now();
  const startAtMs = now + startOffset;
  const endAtMs = now + endOffset;
  await env.withSecurityRulesDisabled(async ctx => {
    await set(ref(ctx.database(), `activeBookings/${id}`), {
      studentId: STUDENT,
      lecturerId: LECTURER,
      startAt: new Date(startAtMs).toISOString(),
      endAt: new Date(endAtMs).toISOString(),
      startAtMs,
      endAtMs,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-officehours',
    database: {
      rules: readFileSync(resolve(__dirname, '../../database.rules.json'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();
});

describe('/activeBookings', () => {
  beforeEach(() => seedBooking(-10 * MIN, 20 * MIN));

  it('nobody can write, not even a participant', async () => {
    await assertFails(
      set(ref(student().database(), 'activeBookings/b1/endAtMs'), 1),
    );
    await assertFails(
      set(ref(lecturer().database(), 'activeBookings/b2'), {studentId: LECTURER}),
    );
  });

  it('participants read their booking, outsiders do not', async () => {
    await assertSucceeds(get(ref(student().database(), 'activeBookings/b1')));
    await assertSucceeds(get(ref(lecturer().database(), 'activeBookings/b1')));
    await assertFails(get(ref(other().database(), 'activeBookings/b1')));
  });

  it('cannot list all bookings', async () => {
    await assertFails(get(ref(student().database(), 'activeBookings')));
  });
});

describe('/bookingLive read', () => {
  beforeEach(async () => {
    await seedBooking(-10 * MIN, 20 * MIN);
    await env.withSecurityRulesDisabled(async ctx => {
      await set(ref(ctx.database(), `bookingLive/b1/${LECTURER}`), position());
    });
  });

  it('participants can read the room', async () => {
    await assertSucceeds(get(ref(student().database(), 'bookingLive/b1')));
    await assertSucceeds(get(ref(lecturer().database(), 'bookingLive/b1')));
  });

  it('outsiders cannot read the room', async () => {
    await assertFails(get(ref(other().database(), 'bookingLive/b1')));
  });

  it('unauthenticated reads nothing', async () => {
    const db = env.unauthenticatedContext().database();
    await assertFails(get(ref(db, 'bookingLive/b1')));
    await assertFails(get(ref(db, 'activeBookings/b1')));
    await assertFails(get(ref(db, 'presence')));
  });
});

describe('/bookingLive write: identity', () => {
  beforeEach(() => seedBooking(-10 * MIN, 20 * MIN));

  it('participant writes own node inside the window', async () => {
    await assertSucceeds(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), position()),
    );
    await assertSucceeds(
      set(ref(lecturer().database(), `bookingLive/b1/${LECTURER}`), position()),
    );
  });

  it('cannot write another uid node', async () => {
    await assertFails(
      set(ref(student().database(), `bookingLive/b1/${LECTURER}`), position()),
    );
  });

  it('outsider cannot write even their own node', async () => {
    await assertFails(
      set(ref(other().database(), `bookingLive/b1/${OTHER}`), position()),
    );
  });

  it('cannot write for a booking that is not in /activeBookings', async () => {
    await assertFails(
      set(ref(student().database(), `bookingLive/nope/${STUDENT}`), position()),
    );
  });

  it('unauthenticated cannot write', async () => {
    await assertFails(
      set(
        ref(env.unauthenticatedContext().database(), `bookingLive/b1/${STUDENT}`),
        position(),
      ),
    );
  });
});

describe('/bookingLive write: time window', () => {
  it('rejects before startAtMs', async () => {
    await seedBooking(10 * MIN, 40 * MIN);
    await assertFails(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), position()),
    );
  });

  it('allows 14 minutes after endAtMs', async () => {
    await seedBooking(-60 * MIN, -14 * MIN);
    await assertSucceeds(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), position()),
    );
  });

  it('rejects 16 minutes after endAtMs', async () => {
    await seedBooking(-60 * MIN, -16 * MIN);
    await assertFails(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), position()),
    );
  });

  it('removal (onDisconnect().remove()) is allowed outside the window while the booking exists', async () => {
    await seedBooking(-60 * MIN, -16 * MIN);
    await env.withSecurityRulesDisabled(async ctx => {
      await set(ref(ctx.database(), `bookingLive/b1/${STUDENT}`), position());
    });
    await assertSucceeds(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), null),
    );
  });

  it('removal of own node inside the window is allowed', async () => {
    await seedBooking(-10 * MIN, 20 * MIN);
    await assertSucceeds(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), position()),
    );
    await assertSucceeds(
      set(ref(student().database(), `bookingLive/b1/${STUDENT}`), null),
    );
  });

  it('cannot remove another participant node', async () => {
    await seedBooking(-10 * MIN, 20 * MIN);
    await env.withSecurityRulesDisabled(async ctx => {
      await set(ref(ctx.database(), `bookingLive/b1/${LECTURER}`), position());
    });
    await assertFails(
      set(ref(student().database(), `bookingLive/b1/${LECTURER}`), null),
    );
  });
});

describe('/bookingLive write: payload validation', () => {
  beforeEach(() => seedBooking(-10 * MIN, 20 * MIN));
  const write = (value: unknown) =>
    set(ref(student().database(), `bookingLive/b1/${STUDENT}`), value);

  it('accepts floor and floorSource', async () => {
    await assertSucceeds(write(position({floor: 3, floorSource: 'baro'})));
    await assertSucceeds(write(position({floor: 1, floorSource: 'manual'})));
    await assertSucceeds(write(position({floor: 3, floorSource: 'room'})));
  });

  it.each(['building', 'x', 'z', 'acc', 'updatedAt'])(
    'rejects a payload missing %s',
    async field => {
      const payload: Record<string, unknown> = position();
      delete payload[field];
      await assertFails(write(payload));
    },
  );

  it('rejects an unknown floorSource', async () => {
    await assertFails(write(position({floor: 2, floorSource: 'gps'})));
  });

  it('rejects a non-integer or out-of-range floor', async () => {
    await assertFails(write(position({floor: 2.5})));
    await assertFails(write(position({floor: 99})));
    await assertFails(write(position({floor: '2'})));
  });

  it('rejects extra children', async () => {
    await assertFails(write(position({secret: 'x'})));
  });

  it('rejects bad types and ranges', async () => {
    await assertFails(write(position({building: ''})));
    await assertFails(write(position({building: 'B'.repeat(17)})));
    await assertFails(write(position({building: 11})));
    await assertFails(write(position({x: 1001})));
    await assertFails(write(position({z: -1001})));
    await assertFails(write(position({x: '5'})));
    await assertFails(write(position({acc: -1})));
    await assertFails(write(position({acc: 201})));
  });

  it('rejects a stale or future updatedAt', async () => {
    await assertFails(write(position({updatedAt: Date.now() - 5 * MIN})));
    await assertFails(write(position({updatedAt: Date.now() + 5 * MIN})));
  });
});

describe('/presence', () => {
  const presence = (extra: Record<string, unknown> = {}) => ({
    status: 'ON_CAMPUS',
    updatedAt: Date.now(),
    ...extra,
  });

  it('a student cannot write presence, not even their own', async () => {
    await assertFails(
      set(ref(student().database(), `presence/${STUDENT}`), presence()),
    );
  });

  it('a lecturer writes only their own presence', async () => {
    await assertSucceeds(
      set(ref(lecturer().database(), `presence/${LECTURER}`), presence()),
    );
    await assertFails(
      set(ref(lecturer().database(), `presence/${OTHER}`), presence()),
    );
  });

  it('a lecturer can remove their own presence', async () => {
    await assertSucceeds(
      set(ref(lecturer().database(), `presence/${LECTURER}`), presence()),
    );
    await assertSucceeds(
      set(ref(lecturer().database(), `presence/${LECTURER}`), null),
    );
  });

  it('validates the presence payload', async () => {
    const write = (v: unknown) =>
      set(ref(lecturer().database(), `presence/${LECTURER}`), v);
    for (const status of ['IN_ROOM', 'ON_CAMPUS', 'AWAY']) {
      await assertSucceeds(write(presence({status})));
    }
    await assertFails(write(presence({status: 'BUSY'})));
    await assertFails(write({status: 'AWAY'}));
    await assertFails(write({updatedAt: Date.now()}));
    await assertFails(write(presence({extra: 1})));
    await assertFails(write(presence({updatedAt: Date.now() - 5 * MIN})));
  });

  it('anyone signed in can read presence, unauthenticated cannot', async () => {
    await env.withSecurityRulesDisabled(async ctx => {
      await set(ref(ctx.database(), `presence/${LECTURER}`), presence());
    });
    await assertSucceeds(get(ref(student().database(), 'presence')));
    await assertSucceeds(get(ref(other().database(), `presence/${LECTURER}`)));
    await assertFails(
      get(ref(env.unauthenticatedContext().database(), `presence/${LECTURER}`)),
    );
  });
});

describe('everything else', () => {
  it('root and unknown paths are closed', async () => {
    await assertFails(get(ref(student().database(), '/')));
    await assertFails(set(ref(student().database(), 'foo/bar'), 1));
  });
});
