import React from 'react';
import { Container } from 'semantic-ui-react';
import Head from 'next/head';
import PagesHeader from './PagesHeader';

export default props => {
  return (
    <Container>
      <Head>
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css"></link>
      </Head>

      <PagesHeader />
      {props.children}
    </Container>
  );
};
