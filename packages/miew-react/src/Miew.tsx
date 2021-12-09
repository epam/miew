import classes from './Miew.module.scss'

function Miew(props) {
  return (
    <div className={classes.miew}>
      <p>HELLO, I'm Miew!</p>
      <p>{props.text}</p>
    </div>
  );
}

export { Miew };
