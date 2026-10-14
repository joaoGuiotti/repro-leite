// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'src/app',
        },
        {
          type: 'domain',
          pattern: 'src/features/*/domain',
          capture: ['feature'],
        },
        {
          type: 'application',
          pattern: 'src/features/*/application',
          capture: ['feature'],
        },
        {
          type: 'infra',
          pattern: 'src/features/*/infra',
          capture: ['feature'],
        },
        {
          type: 'presentation',
          pattern: 'src/features/*/presentation',
          capture: ['feature'],
        },
        {
          type: 'core',
          pattern: 'src/core',
        },
        {
          type: 'ui',
          pattern: 'src/ui',
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'warn',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              allow: [
                { to: { element: { type: 'domain', captured: { feature: '{{from.captured.feature}}' } } } },
                { to: { element: { type: 'core' } } },
              ],
              disallow: [
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'application' } } },
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
            {
              from: { element: { type: 'application' } },
              allow: [
                { to: { element: { type: 'domain', captured: { feature: '{{from.captured.feature}}' } } } },
                { to: { element: { type: 'core' } } },
              ],
              disallow: [
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
            {
              from: { element: { type: 'infra' } },
              allow: [
                { to: { element: { type: 'domain', captured: { feature: '{{from.captured.feature}}' } } } },
                { to: { element: { type: 'core' } } },
              ],
              disallow: [
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'application' } } },
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
            {
              from: { element: { type: 'presentation' } },
              allow: [
                { to: { element: { type: 'domain', captured: { feature: '{{from.captured.feature}}' } } } },
                { to: { element: { type: 'application', captured: { feature: '{{from.captured.feature}}' } } } },
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'core' } } },
              ],
              disallow: [{ to: { element: { type: 'infra' } } }],
            },
            {
              from: { element: { type: 'core' } },
              disallow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'application' } } },
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'ui' } } },
              ],
            },
            {
              from: { element: { type: 'ui' } },
              allow: [{ to: { element: { type: 'ui' } } }, { to: { element: { type: 'core' } } }],
              disallow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'application' } } },
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
          ],
        },
      ],
    },
    ignores: ['dist/*'],
  },
]);
