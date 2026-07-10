import { render } from '@testing-library/react-native';
import { Cursor } from '../Cursor';

describe('Cursor', () => {
  it('renders a steady caret when not animating', async () => {
    const { toJSON } = await render(
      <Cursor color="#007AFF" height={24} animate={false} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
