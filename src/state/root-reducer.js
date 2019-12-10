export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';

export default function rootReducer(state, action) {
  switch (action.type) {
    case INCREMENT:
      return {
        ...state,
        root: state.root + 1,
      };
    case DECREMENT:
      return {
        ...state,
        root: state.root - 1,
      };
    default:
      return state;
  }
}
