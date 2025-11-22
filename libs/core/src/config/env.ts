import * as dotenv from 'dotenv';
import * as env from 'env-var';

dotenv.config();

//  --------------->> ENVIRONMENTS <<--------------//
const NODE_ENV = env.get('NODE_ENV').required().asString();
const isDevelopment =
  env.get('NODE_ENV').required().asString() === 'development';
const isProduction = env.get('NODE_ENV').required().asString() === 'production';

//  --------------->> DATABASE CONFIG <<--------------//
const DatabaseUrl = env.get('DATABASE_URL').required().asString();

//  --------------->> SERVICE PORTS CONFIG <<--------------//

//  --------------->> SERVICE IP CONFIG <<--------------//

// const GAME_MEGA_TEN_SERVICE_HOST = `${GAME_MEGA_TEN_SERVICE_IP}:${GAME_MEGA_TEN_SERVICE_PORT}`;

//  --------------->> JWT CONFIG <<--------------//
const JWTSecret = env.get('JWT_SECRET').required().asString();
const JWTExpires = env.get('JWT_ACCESS_TOKEN_EXPIRES_IN').required().asString();

// //  --------------->> PAYMENT / DEPOSIT CONFIG [PAYSTACK] <<--------------//

//  --------------->> EMAIL PROVIDER CONFIG <<--------------//

//  --------------->> EMAIL PROVIDER CONFIG [SMTP via Nodemailer] <<--------------//

const isLocalInstance = env.get('IS_LOCAL_INSTANCE').asBool();

export const envVariables = {
  isDevelopment,
  isProduction,
  DatabaseUrl,
  isLocalInstance,
  NODE_ENV,
  // RMQConnectionUrl,
  JWT: { JWTSecret, JWTExpires },
  PAYMENT_GATEWAYS: {},
  EMAIL: {},
};
