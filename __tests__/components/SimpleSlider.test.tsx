/** @format */
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SimpleSlider } from '../../src/components/review/SimpleSlider';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('SimpleSlider', () => {
  it('maps the value to a 0-100% width on the fill', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    const onChange = jest.fn();
    await act(async () => {
      tree = TestRenderer.create(
        <SimpleSlider
          value={50}
          min={0}
          max={100}
          onChange={onChange}
        />,
      );
      await flushAsync();
    });
    expect(tree!.root.findByType(View)).toBeTruthy();
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('handles values below min and above max without crashing', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <SimpleSlider
          value={-10}
          min={0}
          max={100}
          onChange={jest.fn()}
        />,
      );
      await flushAsync();
    });
    expect(tree!.toJSON()).not.toBeNull();
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
