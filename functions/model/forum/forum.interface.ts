



export const CATEGORY_PATH = 'forum/category';
export const POST_DATA_PATH = 'forum/post/data';
export const CATEGORY_POST_RELATION_PATH = 'forum/category-post-relation';


export interface CATEGORY {
    id: string;
    name?: string;
    description?: string;
    owner?: string;
}

export type CATEGORIES = Array<CATEGORY>;

export interface POST {
    key?: string;
    uid?: string;
    subject?: string;
    content?: string;
    categories?: Array<string>;
    stamp?: number;
    sticky_forum?: boolean;
    sticky_all_forum?: boolean;
};
