// titlebar color components
const tGray = 64;
const tAlpha = 0.75;

// background color
const bGray = 32;

const theme = {
  titlebarColor: 'silver',
  titlebarGray: tGray,
  titlebarBkg: `rgba(${tGray}, ${tGray}, ${tGray}, ${tAlpha})`,
  titlebarHeight: '40px',
  titlebarAlpha: tAlpha,
  backGray: bGray,
  menuGray: tAlpha * tGray + (1 - tAlpha) * bGray,
  selectionPanelRowHeight: '42px',
};

export default theme;
