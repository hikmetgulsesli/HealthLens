/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { MacroBadge } from '../../src/components/review/MacroBadge';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('MacroBadge', () => {
  it('renders the label and the value', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<MacroBadge label="Protein" value="25 g" />);
      await flushAsync();
    });
    const { Text } = require('react-native');
    const allText = tree!.root.findAllByType(Text);
    const labels = allText.filter(n => n.props.children === 'Protein');
    const values = allText.filter(n => n.props.children === '25 g');
    expect(labels.length).toBeGreaterThan(0);
    expect(values.length).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
