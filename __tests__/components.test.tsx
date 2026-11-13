import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'mock-expo-image', ...props });
  },
}));

import {
  AppText,
  Avatar,
  Button,
  Card,
  Field,
  Icon,
  IconButton,
  ListRow,
  MEMOJI_IMAGES,
  Screen,
  SectionHeader,
  Seg,
  StatusGlyph,
  StatusPill,
  TopNav,
  memojiFor,
  statusGlyph,
  type StatusGlyphKind,
} from '../src/components';

async function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

describe('components', () => {
  describe('rendering each component', () => {
    test('renders AppText', async () => {
      const tree = await render(
        <AppText variant="t1" color="#ffffff" center tabular>
          Tiêu đề
        </AppText>,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders Icon', async () => {
      const tree = await render(
        <Icon as={ChevronRight} size={20} level="active" />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders IconButton', async () => {
      const tree = await render(
        <IconButton accessibilityLabel="Quay lại" icon={ChevronLeft} />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders Button in all variants', async () => {
      const p = await render(
        <Button variant="primary" title="Đăng nhập" />,
      );
      expect(p.toJSON()).toBeTruthy();

      const g = await render(
        <Button variant="ghost" title="Hủy" loading />,
      );
      expect(g.toJSON()).toBeTruthy();

      const q = await render(
        <Button variant="quiet" title="Bỏ qua" disabled />,
      );
      expect(q.toJSON()).toBeTruthy();
    });

    test('renders Field', async () => {
      const tree = await render(
        <Field label="Email" value="test@eiu.edu.vn" hint="Nhập email trường" />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders Seg', async () => {
      const tree = await render(
        <Seg
          options={[
            { value: 'sv', label: 'Sinh viên' },
            { value: 'gv', label: 'Giảng viên' },
          ]}
          value="sv"
          onChange={jest.fn()}
        />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders Card', async () => {
      const staticCard = await render(
        <Card>
          <Text>Nội dung</Text>
        </Card>,
      );
      expect(staticCard.toJSON()).toBeTruthy();

      const pressableCard = await render(
        <Card onPress={jest.fn()}>
          <Text>Nội dung bấm được</Text>
        </Card>,
      );
      expect(pressableCard.toJSON()).toBeTruthy();
    });

    test('renders Avatar with and without uri and squircle', async () => {
      const fallback = await render(<Avatar id="student-1" />);
      expect(fallback.toJSON()).toBeTruthy();

      const remote = await render(
        <Avatar uri="https://example.com/avatar.jpg" shape="squircle" />,
      );
      expect(remote.toJSON()).toBeTruthy();
    });

    test('renders StatusGlyph for all kinds', async () => {
      const kinds: StatusGlyphKind[] = [
        'ok',
        'done',
        'wait',
        'queue',
        'offer',
        'no',
        'off',
        'warn',
      ];
      for (const kind of kinds) {
        const tree = await render(<StatusGlyph kind={kind} size={16} />);
        expect(tree.toJSON()).toBeTruthy();
      }
    });

    test('renders StatusPill', async () => {
      const tree = await render(
        <StatusPill status="CONFIRMED" label="Đã xác nhận" />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders SectionHeader with and without onPress / more', async () => {
      const plain = await render(<SectionHeader title="Gợi ý cho bạn" />);
      expect(plain.toJSON()).toBeTruthy();

      const clickable = await render(
        <SectionHeader
          title="Hôm nay"
          more="Xem tất cả"
          onPress={jest.fn()}
        />,
      );
      expect(clickable.toJSON()).toBeTruthy();
    });

    test('renders ListRow with and without onPress / divider', async () => {
      const row = await render(
        <ListRow
          title="TS. Nguyễn Minh Khoa"
          subtitle="Khoa CNTT · 306.B11"
          divider
        />,
      );
      expect(row.toJSON()).toBeTruthy();

      const clickableRow = await render(
        <ListRow
          title="Trần Quang Minh"
          subtitle="13:00 · Đồ án"
          onPress={jest.fn()}
        />,
      );
      expect(clickableRow.toJSON()).toBeTruthy();
    });

    test('renders TopNav', async () => {
      const tree = await render(
        <TopNav title="Chi tiết" onBack={jest.fn()} />,
      );
      expect(tree.toJSON()).toBeTruthy();
    });

    test('renders Screen with and without scroll', async () => {
      const nonScroll = await render(
        <Screen>
          <Text>Screen content</Text>
        </Screen>,
      );
      expect(nonScroll.toJSON()).toBeTruthy();

      const scroll = await render(
        <Screen scroll>
          <Text>Screen content</Text>
        </Screen>,
      );
      expect(scroll.toJSON()).toBeTruthy();
    });
  });

  describe('statusGlyph mapping', () => {
    test('maps all 11 statuses correctly to kind and opacity', () => {
      const testCases: [string, StatusGlyphKind, number][] = [
        ['PENDING', 'wait', 0.62],
        ['CONFIRMED', 'ok', 1],
        ['FULFILLED', 'ok', 1],
        ['COMPLETED', 'done', 1],
        ['WAITING', 'queue', 0.62],
        ['OFFERED', 'offer', 1],
        ['DECLINED', 'no', 0.62],
        ['CANCELLED', 'off', 0.62],
        ['CANCELED', 'off', 0.62],
        ['EXPIRED', 'off', 0.62],
        ['NO_SHOW', 'warn', 1],
      ];

      expect(testCases.length).toBe(11);

      for (const [status, expectedKind, expectedOpacity] of testCases) {
        const result = statusGlyph(status);
        expect(result.kind).toBe(expectedKind);
        expect(result.opacity).toBeCloseTo(expectedOpacity, 2);
      }
    });

    test('handles case-insensitivity and whitespace', () => {
      expect(statusGlyph('  pending  ')).toEqual({ kind: 'wait', opacity: 0.62 });
      expect(statusGlyph('confirmed')).toEqual({ kind: 'ok', opacity: 1 });
    });
  });

  describe('memoji', () => {
    test('memojiFor returns same image for same id', () => {
      const idA = 'student-uuid-1234';
      const idB = 'lecturer-uuid-5678';

      expect(memojiFor(idA)).toBe(memojiFor(idA));
      expect(memojiFor(idB)).toBe(memojiFor(idB));
    });

    test('memojiFor returns default image for empty id', () => {
      expect(memojiFor('')).toBe(MEMOJI_IMAGES[0]);
    });

    test('exports 57 memoji images', () => {
      expect(MEMOJI_IMAGES.length).toBe(57);
    });
  });

  describe('Field error display', () => {
    test('displays error text when error prop is provided', async () => {
      const errorMessage = 'Email không hợp lệ';
      const tree = await render(
        <Field label="Email" error={errorMessage} />,
      );

      const texts = tree.root.findAllByType(Text);
      const errorNode = texts.find(node => node.props.children === errorMessage);
      expect(errorNode).toBeDefined();
      expect(errorNode?.props.children).toBe(errorMessage);
    });
  });

  describe('Button disabled behavior', () => {
    test('does not call onPress when disabled', async () => {
      const onPress = jest.fn();
      const tree = await render(
        <Button title="Đăng nhập" disabled onPress={onPress} />,
      );

      const button = tree.root.findByProps({ accessibilityRole: 'button' });
      expect(button.props.accessibilityState.disabled).toBe(true);

      await ReactTestRenderer.act(async () => {
        button.props.onPress?.();
      });

      expect(onPress).not.toHaveBeenCalled();
    });
  });
});
