import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery.terminal';
import classNames from 'classnames';

import './Terminal.scss';

function Terminal({ viewer, isTerminalVisible }) {
  const ref = useRef();
  let terminal;

  useEffect(() => {
    if (viewer) {
      viewer.enableHotKeys(!isTerminalVisible);
    }
  }, [isTerminalVisible]);

  function onInit(term) {
    if (viewer) {
      const colors = {
        error: '#f00',
        warn: '#990',
        report: '#1a9cb0',
      };
      const onLogMessage = function (e) {
        const msg = e.message.replace('[', '(').replace(']', ')'); // temp workaround for https://github.com/jcubic/jquery.terminal/issues/470
        term.echo(`[[b;${colors[e.level] || '#666'};]${msg}]`);
      };
      viewer.logger.addEventListener('message', onLogMessage);
    }
  }

  const terminalConfig = {
    greetings: 'Miew - 3D Molecular Viewer\nCopyright © 2015-2020 EPAM Systems, Inc.\n',
    prompt: 'miew> ',
    name: 'miew',
    scrollOnEcho: true,
    height: '100%',
    keydown(event, _term) {
      if (event.keyCode === 192) { // skip '~'
        return false;
      }
      return undefined;
    },
    onInit,
  };

  function handleCommand(command, term) {
    command = command.trim();
    viewer.script(command, (str) => {
      term.echo(str);
    }, (str) => {
      term.error(str);
    });
  }

  useEffect(() => {
    terminal = $(ref.current);
    terminal.terminal((command, term) => {
      if (viewer) {
        handleCommand(command, term);
      } else {
        term.error('Miew is not initialized.');
      }
    }, terminalConfig);
    return () => {
      terminal.destroy();
    };
  }, [viewer]);

  return <div ref={ref} className={classNames('terminal', { 'terminal-hidden': !isTerminalVisible })}/>;
}

export default Terminal;
