// GrapesJS Plugin configurations
// Each entry maps a plugin import to its options
// Dynamically imported in GrapesEditor.tsx

export type PluginEntry = {
  moduleName: string;
  options?: Record<string, unknown>;
};

export const pluginEntries: PluginEntry[] = [
  {
    moduleName: 'grapesjs-preset-webpage',
    options: {},
  },
  {
    moduleName: 'grapesjs-navbar',
    options: {},
  },
  {
    moduleName: 'grapesjs-tabs',
    options: {
      tabsBlock: { category: 'Extra' },
    },
  },
  {
    moduleName: 'grapesjs-custom-code',
    options: {},
  },
  {
    moduleName: 'grapesjs-touch',
    options: {},
  },
  {
    moduleName: 'grapesjs-tooltip',
    options: {},
  },
  {
    moduleName: 'grapesjs-tui-image-editor',
    options: {
      script: [
        'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
        'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.js',
        'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.js',
      ],
      style: [
        'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.css',
        'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.css',
      ],
    },
  },
  {
    moduleName: 'grapesjs-typed',
    options: {
      block: {
        category: 'Extra',
        content: {
          type: 'typed',
          'type-speed': 40,
          strings: ['First string', 'Second string', 'Third string'],
        },
      },
    },
  },
  {
    moduleName: 'grapesjs-lory-slider',
    options: {},
  },
  {
    moduleName: 'grapesjs-style-gradient',
    options: {},
  },
  {
    moduleName: 'grapesjs-style-filter',
    options: {},
  },
  {
    moduleName: 'grapesjs-style-bg',
    options: {},
  },
  {
    moduleName: 'grapesjs-blocks-flexbox',
    options: {},
  },
  {
    moduleName: 'grapesjs-plugin-forms',
    options: {},
  },
  {
    moduleName: 'grapesjs-component-countdown',
    options: {},
  },
];
