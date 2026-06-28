import { render } from '@testing-library/react-native';
import { Cursor } from '../Cursor';

describe('Cursor', () => {
  it('renders a steady caret when not animating', () => {
    const { toJSON } = render(
      <Cursor color="#007AFF" height={24} animate={false} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
