const info = (state = [], action) => {
  switch (action.type) {
    case 'SEND_INFO':
      return { complexes: action.payload };
    default:
      return state;
  }
};

export default info;
