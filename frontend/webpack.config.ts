import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class DiagnosticPlugin {
  apply(compiler: any) {
    compiler.hooks.beforeRun.tap('DiagnosticPlugin', () => {
      console.log('\n========== DIAGNOSTIC OUTPUT ==========');
      console.log('Environment variables:');
      Object.entries(process.env).forEach(([key, value]) => {
        if (key.startsWith('REACT_APP_')) {
          console.log(`${key}:`, value);
        }
      });
      console.log('=====================================\n');
    });

    compiler.hooks.compilation.tap('DiagnosticPlugin', (compilation: any) => {
      console.log('\n========== COMPILATION STARTED ==========');
      console.log('DefinePlugin variables:');
      console.log({
        NODE_ENV: process.env.NODE_ENV || 'development',
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
        REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
        REACT_APP_COGNITO_REGION: process.env.REACT_APP_COGNITO_REGION || 'eu-west-2'
      });
      console.log('======================================\n');
    });
  }
}

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const envVars = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
  REACT_APP_COGNITO_REGION: process.env.REACT_APP_COGNITO_REGION || 'eu-west-2'
};

console.log('\nProcessed Environment Variables:');
console.log('='.repeat(40));
console.log(envVars);

const config: Configuration = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  plugins: [
    new DiagnosticPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true
    }),
    new DefinePlugin({
      'window.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'development',
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://52ke9vmcga.execute-api.eu-west-2.amazonaws.com/dev',
        REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'eu-west-2_FwrkPGqg7',
        REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID || '2em7se1kll78d366fb1r9st60c',
        REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION || 'eu-west-2'
      })
    }),
    {
      apply: (compiler: any) => {
        compiler.hooks.done.tap('DiagnosticPlugin', (stats: any) => {
          console.log('\nWebpack Build Complete:');
          console.log('='.repeat(40));
          console.log('Environment variables injected into build:');
          console.log(JSON.stringify({
            NODE_ENV: process.env.NODE_ENV || 'development',
            REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
            REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
            REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
            REACT_APP_COGNITO_REGION: process.env.REACT_APP_COGNITO_REGION || 'eu-west-2'
          }, null, 2));
        });
      }
    }
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    hot: true,
    port: 3000,
    proxy: [{
      context: ['/api'],
      target: 'https://52ke9vmcga.execute-api.eu-west-2.amazonaws.com/dev',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
      secure: false
    }]
  },
  mode: 'development',
  devtool: 'source-map'
};

export default config; 