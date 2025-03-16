import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import dotenv from 'dotenv';

// Load environment variables from .env file
const result = dotenv.config();
console.log('DOTENV RESULT:', result);

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
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: false,
          sources: false,
          preprocessor: (content: string) => {
            console.log('\nHTML Template Processing:');
            console.log('='.repeat(40));
            const result = content.replace(
              /<%= process.env.(\w+) %>/g,
              (match, key) => {
                const value = envVars[key as keyof typeof envVars];
                console.log(`Replacing ${match} with:`, value);
                return value || '';
              }
            );
            return result;
          }
        }
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
      template: './src/index.html',
      inject: true
    }),
    new DefinePlugin({
      'globalThis.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'development',
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        REACT_APP_COGNITO_USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
        REACT_APP_COGNITO_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
        REACT_APP_COGNITO_REGION: process.env.REACT_APP_COGNITO_REGION || 'eu-west-2'
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
      directory: path.join(__dirname, 'dist'),
    },
    historyApiFallback: true,
    compress: true,
    port: 3000,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      console.log('\nDevServer Middleware Setup:');
      console.log('='.repeat(40));
      console.log('globalThis.env:', (global as any).env);
      return middlewares;
    }
  },
};

export default config; 