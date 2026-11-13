import {
  DAY_CHIPS,
  EMPTY_FILTERS,
  departmentsOf,
  hasActiveFilters,
  lecturerSubtitle,
  toLecturerQuery,
} from '../src/features/lecturers/lecturerLogic';

describe('toLecturerQuery', () => {
  test('empty filters give an empty query', () => {
    expect(toLecturerQuery(EMPTY_FILTERS)).toEqual({});
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  test('trims q and keeps only set keys', () => {
    expect(
      toLecturerQuery({
        q: '  khoa ',
        department: 'CNTT',
        dayOfWeek: 4,
        availableOnly: true,
      }),
    ).toEqual({
      q: 'khoa',
      department: 'CNTT',
      dayOfWeek: 4,
      availableOnly: true,
    });
    expect(toLecturerQuery({ ...EMPTY_FILTERS, q: '   ' })).toEqual({});
  });

  test('hasActiveFilters', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, availableOnly: true })).toBe(
      true,
    );
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: 'a' })).toBe(true);
  });
});

describe('list helpers', () => {
  test('day chips are Monday..Saturday with Vietnamese names', () => {
    expect(DAY_CHIPS.map(d => d.value)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(DAY_CHIPS[0].label).toBe('Thứ Hai');
    expect(DAY_CHIPS[5].label).toBe('Thứ Bảy');
  });

  test('lecturerSubtitle joins department and blurb', () => {
    expect(lecturerSubtitle({ department: 'CNTT', blurb: 'CSDL' })).toBe(
      'CNTT · CSDL',
    );
    expect(lecturerSubtitle({ department: null, blurb: ' ' })).toBe('');
    expect(lecturerSubtitle({ department: 'Kinh tế', blurb: null })).toBe(
      'Kinh tế',
    );
  });

  test('departmentsOf dedupes, sorts and keeps previous values', () => {
    expect(
      departmentsOf(
        [{ department: 'Kinh tế' }, { department: null }, { department: 'CNTT' }],
        ['CNTT', 'Kỹ thuật'],
      ),
    ).toEqual(['CNTT', 'Kinh tế', 'Kỹ thuật']);
  });
});
