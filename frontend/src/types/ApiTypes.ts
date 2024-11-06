// apitypes.ts

import { MosaicNode } from 'react-mosaic-component';

export interface ApiResponse<T> {
  success: boolean;
  errorMessage: string;
  data?: T;
}

export type LogoutRequestT = {
  email: string;
  password: string;
};

export type LoginRequestT = {
  email: string;
  password: string;
};

export type LoginResponseT = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

export type SignUpRequestT = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type TileT = {
  id: number;
  tile_id: string;
  title: string;
  description: string;
  tile_type: string;
  config: string;
  state: string;
  created_at: string;
  owned: boolean;
};

export type CalendarEventT = {
  id: number;
  release_date: string;
  release_id: number;
  release_name: string;
};

export type ChatMessageT = {
  id: number;
  user_id: number;
  username: string;
  message: string;
  timestamp: string;
};

export type DashboardT = {
  id: number;
  name: string;
  config: MosaicNode<string>;
};
