import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from '../routes';

export default () => {
  return (
    <Menu style={{ marginTop: '10px' }}>
      <Link route="/">
        <a className="item">
          Ethereum Payment Channel
          </a>
      </Link>

      <Menu.Menu position="right">
      <Link route="/">
        <a className="item">
          View active deposits
        </a>
      </Link>

      <Link route="/deposits/new">
        <a className="item">
          +
        </a>
      </Link>


      </Menu.Menu>
    </Menu>
  );
};
