import { GetResult, OperationPayload } from "@prisma/client/runtime/library";

type CleanOptions<TInclude, TSelect, TOmit> = (TInclude extends undefined
    ? {}
    : { include: TInclude }) &
    (TSelect extends undefined ? {} : { select: TSelect }) &
    (TOmit extends undefined ? {} : { omit: TOmit });

class QueryBuilder<
    TFindManyArgs = any,
    TPayload extends OperationPayload = any,
    TInclude = undefined,
    TSelect = undefined,
    TOmit = undefined
> {
    private model: any;
    private query: Record<string, unknown>;
    private prismaQuery: Partial<TFindManyArgs> | any = {};

    /**
     * @template TFindManyArgs - The Prisma FindManyArgs type for the model (e.g., Prisma.UserFindManyArgs)
     * @template TPayload - The Prisma Payload type for the model (e.g., Prisma.$UserPayload)
     * @param model - The Prisma model client (e.g., prisma.user)
     * @param query - The raw query object
     */
    constructor(model: any, query: Record<string, unknown>) {
        this.model = model;
        this.query = query;
    }
    /**
     * Adds OR search conditions for specified fields using query.searchTerm.
     */
    search(
        fields: TFindManyArgs extends { distinct?: infer T } ? T : string[]
    ) {
        const searchTerm = this.query.searchTerm as string;
        if (searchTerm) {
            this.prismaQuery.where = {
                ...this.prismaQuery.where,
                OR: (fields as string[]).map((field) => ({
                    [field]: { contains: searchTerm, mode: "insensitive" },
                })),
            };
        }
        return this;
    }

    /**
     * Applies filter conditions for query fields.
     * Supports "null", "notnull", exact fields, and contains search.
     */
    filter(
        exactFields: TFindManyArgs extends { distinct?: infer T }
            ? T
            : string[] = [] as any
    ) {
        const queryObj = { ...this.query };
        const excludeFields = [
            "searchTerm",
            "sort",
            "limit",
            "page",
            "fields",
            "populate",
            "dateRange",
        ];
        excludeFields.forEach((field) => delete queryObj[field]);

        const formattedFilters: Record<string, any> = {};

        for (const [field, value] of Object.entries(queryObj)) {
            if (value === "null") {
                formattedFilters[field] = null;
            } else if (value === "notnull") {
                formattedFilters[field] = { not: null };
            } else if ((exactFields as string[]).includes(field)) {
                formattedFilters[field] = { equals: value };
            } else {
                formattedFilters[field] = {
                    contains: value,
                    mode: "insensitive",
                };
            }
        }

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            ...formattedFilters,
        };

        return this;
    }

    /**
     * Merges raw arguments into prismaQuery.
     * Special handling for 'where' to merge AND/OR conditions safely.
     */
    rawArgs(args: Partial<TFindManyArgs>) {
        Object.entries(args).forEach(([key, value]) => {
            if (key === "where" && value) {
                const whereValue = value as any;
                this.prismaQuery.where = {
                    ...(this.prismaQuery.where ?? {}),
                    ...whereValue,
                    AND: [
                        ...(this.prismaQuery.where?.AND ?? []),
                        ...(whereValue.AND
                            ? Array.isArray(whereValue.AND)
                                ? whereValue.AND
                                : [whereValue.AND]
                            : []),
                    ],
                    OR: [
                        ...(this.prismaQuery.where?.OR ?? []),
                        ...(whereValue.OR
                            ? Array.isArray(whereValue.OR)
                                ? whereValue.OR
                                : [whereValue.OR]
                            : []),
                    ],
                };
            } else if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {
                this.prismaQuery[key] = {
                    ...(this.prismaQuery[key] ?? {}),
                    ...value,
                };
            } else {
                this.prismaQuery[key] = value;
            }
        });

        return this;
    }

    /**
     * Adds raw filters to 'where'.
     * Safely merges AND/OR with existing where conditions.
     */
    rawFilter(
        filters: TFindManyArgs extends { where?: infer W }
            ? W
            : Record<string, any>
    ) {
        const where = this.prismaQuery.where ?? {};
        const newWhere = {
            ...where,
            ...filters!,
            AND: [
                ...(where.AND ?? []),
                ...((filters as any).AND
                    ? Array.isArray((filters as any).AND)
                        ? (filters as any).AND
                        : [(filters as any).AND]
                    : []),
            ],
            OR: [
                ...(where.OR ?? []),
                ...((filters as any).OR
                    ? Array.isArray((filters as any).OR)
                        ? (filters as any).OR
                        : [(filters as any).OR]
                    : []),
            ],
        };
        this.prismaQuery.where = newWhere;
        return this;
    }

    /**
     * Applies date range filters from query.dateRange.
     * Supports multiple fields with gte/lte.
     * Ex: createdAt[2025-02-19T10:13:59.425Z,2025-02-20T10:13:59.425Z];updatedAt[2025-02-19T12:00:00.000Z,2025-02-19T15:00:00.000Z]
     */
    range() {
        const dateRanges = this.query.dateRange
            ? (this.query.dateRange as string).split(";")
            : [];
        if (dateRanges.length > 0) {
            const rangeFilters: Record<string, any>[] = [];

            dateRanges.forEach((range) => {
                const [fieldName, dateRange] = range.split("[");
                if (fieldName && dateRange) {
                    const cleanedDateRange = dateRange.replace("]", "");
                    const [startRange, endRange] = cleanedDateRange.split(",");

                    const rangeFilter: Record<string, any> = {};
                    if (startRange && endRange) {
                        rangeFilter[fieldName] = {
                            gte: new Date(startRange),
                            lte: new Date(endRange),
                        };
                    } else if (startRange) {
                        rangeFilter[fieldName] = { gte: new Date(startRange) };
                    } else if (endRange) {
                        rangeFilter[fieldName] = { lte: new Date(endRange) };
                    }

                    if (Object.keys(rangeFilter).length > 0) {
                        rangeFilters.push(rangeFilter);
                    }
                }
            });

            if (rangeFilters.length > 0) {
                this.prismaQuery.where = {
                    ...this.prismaQuery.where,
                    OR: rangeFilters,
                };
            }
        }

        return this;
    }

    /**
     * Applies sorting from query.sort string.
     * Supports "-" prefix for descending order.
     */
    sort() {
        const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];
        const orderBy = sort.map((field) => {
            if (field.startsWith("-")) {
                return { [field.slice(1)]: "desc" };
            }
            return { [field]: "asc" };
        });

        this.prismaQuery.orderBy = orderBy;
        return this;
    }

    /**
     * Applies custom sort fields.
     * Accepts single object or array of Prisma orderBy objects.
     */
    sortBy(
        fields: TFindManyArgs extends { orderBy?: infer T }
            ? T
            : Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[]
    ) {
        const existing = Array.isArray(this.prismaQuery.orderBy)
            ? this.prismaQuery.orderBy
            : this.prismaQuery.orderBy
            ? [this.prismaQuery.orderBy]
            : [];
        const newFields = Array.isArray(fields) ? fields : [fields];
        this.prismaQuery.orderBy = [...existing, ...newFields];
        return this;
    }

    /**
     * Applies pagination based on query.page and query.limit.
     */
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;

        this.prismaQuery.skip = skip;
        this.prismaQuery.take = limit;

        return this;
    }

    /**
     * Selects fields from query.fields string.
     */
    fields() {
        const fields = (this.query.fields as string)?.split(",") || [];
        if (fields.length > 0) {
            this.prismaQuery.select = fields.reduce(
                (acc: Record<string, boolean>, field) => {
                    acc[field] = true;
                    return acc;
                },
                {}
            );
        }
        return this;
    }

    /**
     * Adds Prisma include fields to query.
     */
    include<
        T extends TFindManyArgs extends { include?: infer I }
            ? I
            : Record<string, any>
    >(
        fields: T
    ): [TSelect] extends [undefined]
        ? QueryBuilder<TFindManyArgs, TPayload, T, TSelect, TOmit>
        : "❌ Cannot use 'include' and 'select' together - Use one" {
        this.prismaQuery.include = { ...this.prismaQuery.include, ...fields! };
        return this as any;
    }

    /**
     * Adds Prisma select fields to query.
     */
    select<
        T extends TFindManyArgs extends { select?: infer S }
            ? S
            : Record<string, any>
    >(
        fields: T
    ): [TInclude] extends [undefined]
        ? [TOmit] extends [undefined]
            ? QueryBuilder<TFindManyArgs, TPayload, TInclude, T, TOmit>
            : "❌ Cannot use 'select' and 'omit' - Use one"
        : "❌ Cannot use 'select' and 'include' - Use one" {
        this.prismaQuery.select = { ...this.prismaQuery.select, ...fields! };
        return this as any;
    }

    /**
     * Adds Prisma omit fields to query.
     */
    omit<
        T extends TFindManyArgs extends { omit?: infer O }
            ? O
            : Record<string, any>
    >(
        fields: T
    ): [TSelect] extends [undefined]
        ? QueryBuilder<TFindManyArgs, TPayload, TInclude, TSelect, T>
        : "❌ Cannot use 'omit' with 'select' - Use one" {
        this.prismaQuery.omit = { ...this.prismaQuery.omit, ...fields! };
        return this as any;
    }

    /**
     * Executes the Prisma findMany query with any extra options.
     */
    async execute(
        extraOptions: TFindManyArgs extends { [key: string]: any }
            ? TFindManyArgs
            : Record<string, any> = {} as any
    ): Promise<
        GetResult<TPayload, CleanOptions<TInclude, TSelect, TOmit>, "findMany">
    > {
        return this.model.findMany({
            ...this.prismaQuery,
            ...extraOptions,
        });
    }

    /**
     * Returns total count, current page, limit, and total pages.
     */
    async countTotal() {
        const total = await this.model.count({ where: this.prismaQuery.where });
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const totalPage = Math.ceil(total / limit);

        return {
            page,
            limit,
            total,
            totalPage,
        };
    }
}

export default QueryBuilder;
