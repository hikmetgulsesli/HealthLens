/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { MacroBento } from '../../src/components/review/MacroBento';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('MacroBento', () => {
  it('renders the label and the value', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<MacroBento label="Yağ" value="12 g" />);
      await flushAsync();
    });
    const { Text } = require('react-native');
    const allText = tree!.root.findAllByType(Text);
    expect(allText.filter(n => n.props.children === 'Yağ').length).toBeGreaterThan(0);
    expect(allText.filter(n => n.props.children === '12 g').length).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
