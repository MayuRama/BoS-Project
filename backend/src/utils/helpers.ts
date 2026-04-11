import { v4 as uuidv4 } from 'uuid';

export const generateRefNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `FX-${y}${m}${d}-${rand}`;
};

export const generateAlertCode = (): string => {
  const date = new Date();
  const y = date.getFullYear();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AML-${y}-${rand}`;
};

export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

export const getPageParams = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(String(query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export { uuidv4 };
