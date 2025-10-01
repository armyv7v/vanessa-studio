import { withCloudflare } from 'open-next/helpers';

export default withCloudflare({
  default: {
    placement: 'regional',
    runtime: 'node',
  },
  functions: {
    api: {
      placement: 'regional',
      runtime: 'node',
      patterns: ['/api/*'],
    },
  },
});
