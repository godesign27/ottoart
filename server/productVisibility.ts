// Draft products exist only for admins. Anyone else gets the list without them, and "not found" for one by id.
export function isDraft(product: { status?: string | null }): boolean {
  return product.status === "draft";
}

export function withoutDrafts<T extends { status?: string | null }>(products: T[]): T[] {
  return products.filter((product) => !isDraft(product));
}
