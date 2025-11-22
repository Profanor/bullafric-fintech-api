type AnyModelDelegate = {
  count: (args?: any) => Promise<number>;
};

interface MetaParams {
  page: number;
  limit: number;
  query?: any;
}

type DBClient = any;

export const generatePaginationMeta = async (
  db: DBClient,
  model: any,
  params: MetaParams,
): Promise<{
  currentPage: number;
  nextPage: number;
  limit: number;
  totalElements: number;
  prevPage: number;
  totalPage: number;
}> => {
  const { limit, page, query } = params;

  const modelDelegate = db[model] as unknown as AnyModelDelegate;

  const totalElements = await modelDelegate.count(query);

  const totalPage = Math.ceil(totalElements / limit);
  const prevPage = page > 1 ? page - 1 : 1;
  const nextPage = page < totalPage ? page + 1 : totalPage;

  return {
    currentPage: page,
    nextPage,
    limit,
    totalElements,
    prevPage,
    totalPage,
  };
};
