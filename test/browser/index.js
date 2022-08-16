import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import '../fixtures'; // import fixtures

// import tests
import './component';
import './router';
import '../server/component-param';

chai.config.truncateThreshold = 0; // nicer deep equal errors
