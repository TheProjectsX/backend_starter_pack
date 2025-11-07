/**
 * QueryBuilder - Version 2.0
 *
 * DESCRIPTION::
 * Full Type Safety
 * Uses Prisma Generated types to Show correct auto complete and types
 * Returns the final Included, Selected, Omitted value
 * Doesn't require any type input, only model and query
 */

import { Prisma } from "@prisma/client";
import {
    DefaultArgs,
    GetPayloadResult,
    GetResult,
} from "@prisma/client/runtime/library";

// Helper to check if a type is an enum
type IsEnum<T> = T extends string | number
    ? string extends T
        ? false
        : number extends T
        ? false
        : true
    : false;

type EnumKeys<T> = {
    [K in keyof T]: IsEnum<T[K]> extends true ? K : never;
}[keyof T];

// Trying to convert the Return payload to OperationPayload type from "@prisma/client/runtime/library"
// Why? Cause we need OperationPayload to use to parse type from GetResult
// We can definitely use Prisma.$ModelPayload , but it will require to pass the type as generic, which we are wanting to avoid!
type ConvertPayload<Payload extends Record<any, any>[]> = {
    name: "";
    objects: {
        settings: Prisma.$SettingsPayload<DefaultArgs>[];
    };
    scalars: GetPayloadResult<Payload[0], { [x: string]: () => unknown }>;
    composites: {};
};

type CleanOptions<TInclude, TSelect, TOmit> = (TInclude extends undefined
    ? {}
    : { include: TInclude }) &
    (TSelect extends undefined ? {} : { select: TSelect }) &
    (TOmit extends undefined ? {} : { omit: TOmit });

class QueryBuilder<
    Model extends { findMany: (...args: any) => any },
    TFindManyArgs = Parameters<Model["findMany"]>[0],
    TPayload extends Record<any, any>[] = Awaited<
        ReturnType<Model["findMany"]>
    >,
    TInclude = undefined,
    TSelect = undefined,
    TOmit = undefined
> {
    private model: any;
    private query: Record<string, unknown>;
    private prismaQuery: Partial<TFindManyArgs> | any = {};

    /**
     * @param model - The Prisma model client (e.g., prisma.user)
     * @param query - The raw query object
     */
    constructor(model: Model, query: Record<string, unknown>) {
        this.model = model;
        this.query = query;
    }
    /**
     * Adds OR search conditions for specified fields using query.searchTerm.
     
     * Supports nested fields: `["name", "clinic.name"]`
     */
    search(
        fields: TFindManyArgs extends { distinct?: infer T }
            ? T & string
            : string[]
    ) {
        const searchTerm = this.query.searchTerm as string;
        if (!searchTerm) return this;

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            OR: (fields as string[]).map((field) => {
                const parts = field.split("."); // split nested path
                return parts.reduceRight<any>((acc, key, index) => {
                    if (index === parts.length - 1) {
                        // last part = the actual field
                        return {
                            [key]: {
                                contains: searchTerm,
                                mode: "insensitive",
                            },
                        };
                    }
                    return { [key]: acc }; // wrap previous level
                }, {});
            }),
        };

        return this;
    }

    /**
     * Applies filter conditions for query fields.
     * Supports "null", "notnull", exact fields, and contains search.
     */
    filter(exactFields: (EnumKeys<TPayload[0]> | (string & {}))[]) {
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
                const parts = field.split(".");
                const nestedFilter = parts.reduceRight<any>(
                    (acc, key, index) => {
                        if (index === parts.length - 1) {
                            return { [key]: { equals: value } };
                        }
                        return { [key]: acc };
                    },
                    {}
                );
                Object.assign(formattedFilters, nestedFilter);
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
        ? QueryBuilder<Model, TFindManyArgs, TPayload, T, TSelect, TOmit>
        : "Please either choose `select` or `include`" {
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
            ? QueryBuilder<Model, TFindManyArgs, TPayload, TInclude, T, TOmit>
            : "Please either choose `select` or `omit`"
        : "Please either choose `select` or `include`" {
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
        ? QueryBuilder<Model, TFindManyArgs, TPayload, TInclude, TSelect, T>
        : "Please either choose `select` or `omit`" {
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
        GetResult<
            ConvertPayload<TPayload>,
            CleanOptions<TInclude, TSelect, TOmit>,
            "findMany"
        >
    > {
        return this.model.findMany({
            ...this.prismaQuery,
            ...extraOptions,
        });
    }

    /**
     * Returns total count, current page, limit, and total pages.
     */
    async countTotal(): Promise<{
        page: number;
        limit: number;
        total: any;
        totalPage: number;
    }> {
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
