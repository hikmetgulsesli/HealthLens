import React, { type ReactElement } from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';

interface ReactProps {
  testID?: string;
  accessibilityState?: { selected?: boolean };
  accessibilityLabel?: string;
  accessibilityRole?: string;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  children?: unknown;
}

export interface RenderScreenResult {
  tree: ReactTestRenderer;
  findAllByTestID: (id: string) => ReactTestInstance[];
  findAllByText: (text: string) => ReactTestInstance[];
  firstByTestID: (id: string) => ReactTestInstance;
  pressById: (id: string) => Promise<void>;
  typeById: (id: string, text: string) => Promise<void>;
  alertSpy: jest.SpyInstance;
  unmount: () => Promise<void>;
}

const flushAsync = () =>
  new Promise<void>(resolve => setImmediate(resolve));

/**
 * Standard render harness used by every screen test.
 *
 * - Wraps TestRenderer.create() in act() so state updates flush before
 *   queries run.
 * - Auto-mocks Alert.alert on the react-native module so validation
 *   calls don't crash the renderer.
 * - findAllByTestID walks the tree matching props.testID; multiple
 *   matches usually mean the testID was forwarded to a Pressable
 *   wrapper, all of which count.
 */
export async function renderScreen(
  element: ReactElement,
  options: { setup?: () => void } = {},
): Promise<RenderScreenResult> {
  if (options.setup) options.setup();
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(element);
    await flushAsync();
  });

  const findAllByTestID = (id: string): ReactTestInstance[] =>
    tree.root.findAll(node => (node.props as ReactProps)?.testID === id);

  const findAllByText = (text: string): ReactTestInstance[] =>
    tree.root.findAll(node => {
      const c = (node.props as ReactProps)?.children;
      return c === text || (Array.isArray(c) && c.includes(text as never));
    });

  const firstByTestID = (id: string): ReactTestInstance => {
    const matches = findAllByTestID(id);
    if (matches.length === 0) {
      throw new Error(`No element with testID="${id}"`);
    }
    return matches[0];
  };

  const pressById = async (id: string) => {
    const node = firstByTestID(id);
    await act(async () => {
      (node.props as ReactProps).onPress?.();
      await flushAsync();
    });
  };

  const typeById = async (id: string, text: string) => {
    const node = firstByTestID(id);
    await act(async () => {
      (node.props as ReactProps).onChangeText?.(text);
      await flushAsync();
    });
  };

  const unmount = async () => {
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
    alertSpy.mockRestore();
  };

  return {
    tree,
    findAllByTestID,
    findAllByText,
    firstByTestID,
    pressById,
    typeById,
    alertSpy,
    unmount,
  };
}
