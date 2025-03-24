import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import webpack from 'webpack';
import 'webpack-dev-server';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
console.log('Loading environment from:', envFile);
const result = dotenv.config({ path: envFile });
if (result.error) {
  console.warn('Error loading .env file:', result.error);
} else {
  console.log('Loaded environment variables:', 
    Object.keys(process.env)
      .filter(key => key.startsWith('REACT_APP_'))
      .map(key => key)
  );
}

// Diagnostic plugin to log environment variables
class DiagnosticPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.beforeRun.tap('DiagnosticPlugin', () => {
      console.log('\n========== WEBPACK BUILD DIAGNOSTICS ==========');
      console.log('Current NODE_ENV:', process.env.NODE_ENV);
      console.log('Environment variables available to webpack:');
      Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')).forEach(key => {
        console.log(`${key}:`, process.env[key]);
      });
      console.log('===========================================\n');
    });

    compiler.hooks.afterEnvironment.tap('DiagnosticPlugin', () => {
      console.log('\n========== WEBPACK ENVIRONMENT SETUP ==========');
      console.log('Trying to load .env file:', `./.env.${process.env.NODE_ENV || 'development'}`);
      console.log('===========================================\n');
    });
  }
}

const config: webpack.Configuration = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    },
    fallback: {
      process: require.resolve('process/browser')
    }
  },
  plugins: [
    new DiagnosticPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true
    }),
    new Dotenv({
      path: `./.env.${process.env.NODE_ENV || 'development'}`,
      systemvars: true
    }),
    new webpack.DefinePlugin({
      'window.env.REACT_APP_AWS_REGION': JSON.stringify(process.env.REACT_APP_AWS_REGION),
      'window.env.REACT_APP_COGNITO_USER_POOL_ID': JSON.stringify(process.env.REACT_APP_COGNITO_USER_POOL_ID),
      'window.env.REACT_APP_COGNITO_CLIENT_ID': JSON.stringify(process.env.REACT_APP_COGNITO_CLIENT_ID),
      'window.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
      'window.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
    open: true,
    proxy: [{
      context: ['/api'],
      target: process.env.REACT_APP_API_URL',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api'  // Keep the /api prefix in the request
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('\n========== PROXY REQUEST ==========');
        console.log('Original URL:', req.url);
        console.log('Method:', req.method);
        console.log('Headers:', req.headers);
        console.log('Target URL:', proxyReq.path);
        console.log('===================================\n');
      }
    }],
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      console.log('\n========== DEV SERVER ENVIRONMENT ==========');
      console.log('Environment variables available to dev server:');
      Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')).forEach(key => {
        console.log(`${key}:`, process.env[key]);
      });
      console.log('=========================================\n');

      return middlewares;
    }
  },
  devtool: 'source-map'
};

export default config; 