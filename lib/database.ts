/* eslint-disable no-unused-vars */
import { PublicKEY } from '@middleware/jwt.keys';
import { CookieNames, ErrorNames } from '@ts-types/enums';
import { StaffType } from '@ts-types/generated';
import { setCookie } from '@utils/cookies';
import { limit } from '@utils/utils';
import jwt, { Algorithm } from 'jsonwebtoken';
import { isEmpty } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PoolClient, QueryResult } from 'pg';

import CRUDPool, { random } from './conn';
import { loginQueries } from './sql';

export default class PostgresClient {
  protected readonly ErrorNames: typeof ErrorNames;
  protected readonly CookieNames: typeof CookieNames;
  public POST: string;
  public GET: string;
  public DELETE: string;
  public limit: number;

  constructor() {
    this.ErrorNames = ErrorNames;
    this.CookieNames = CookieNames;
    this.POST = 'POST';
    this.GET = 'GET';
    this.DELETE = 'DELETE';
    this.limit = limit;
  }

  public authorization = async (
    req: NextApiRequest,
    res: NextApiResponse,
    isAdmin?: boolean
  ): Promise<StaffType> => {
    const jwtToken = req.cookies[this.CookieNames.STAFF_TOKEN_NAME];
    if (!jwtToken) {
      res.status(403).json({
        error: {
          message: 'No jwtToken Provided!'
        }
      });
    }
    const Alg: Algorithm = 'RS256';

    const { staffId } = jwt.verify(jwtToken, PublicKEY, {
      algorithms: Alg
    });

    const client = await this.transaction();

    const { rows } = await client.query<StaffType, string>(
      loginQueries.staff(),
      [staffId]
    );

    client.release();

    const staff = rows[0];

    const PRODUCTION_ENV = process.env.NODE_ENV === 'production';

    if (!staff?.isAdmin && isAdmin) {
      throw new Error(this.ErrorNames.FORBIDDEN);
    }

    if (isEmpty(staff)) {
      setCookie(res, this.CookieNames.STAFF_TOKEN_NAME, '', {
        httpOnly: true,
        secure: PRODUCTION_ENV,
        maxAge: 0,
        sameSite: 'strict',
        path: '/'
      });
      throw new Error('User does not exist');
    }
    if (!staff.active) {
      setCookie(res, this.CookieNames.STAFF_TOKEN_NAME, '', {
        httpOnly: true,
        secure: PRODUCTION_ENV,
        maxAge: 0,
        sameSite: 'strict',
        path: '/'
      });
      throw new Error('User is not active');
    }
    return staff;
  };

  public transaction = async (): Promise<PoolClient> => {
    const client: PoolClient = await CRUDPool.connect();

    const query = client.query;
    const release = client.release;

    client.query = (...args: unknown[]) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };

    client.release = async () => {
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  };

  public query = async <T, V>(
    queryText: string,
    values: V[]
  ): Promise<QueryResult<T>> => {
    return await CRUDPool.query(queryText, values);
  };

  protected async tx<T>(
    callback: ({
      query,
      connections
    }: {
      query: QueryResult;
      connections: number;
    }) => Promise<T>
  ) {
    console.log('---->>>>>', CRUDPool._clients?.length);
    try {
      const results = await callback({
        query: this.query,
        connections: CRUDPool?._clients?.length
      });
      return results;
    } catch (err) {
      console.log('------> tX:>', err);
      throw new Error(err.message);
    }
  }
}
