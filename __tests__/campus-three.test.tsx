import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SmokeCube } from '../src/campus/three/SmokeCube';

describe('SmokeCube', () => {
  it('renders the r3f native Canvas with the expo-gl mock', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<SmokeCube />);
    });
    expect(tree.toJSON()).not.toBeNull();
    await act(async () => {
      tree.unmount();
    });
  });
});
