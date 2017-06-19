



export const CATEGORY_PATH = 'forum/category';
export const POST_DATA_PATH = 'forum/post/data';
export const CATEGORY_POST_RELATION_PATH = 'forum/category-post-relation';
export const ALL_CATEGORIES = 'all-categories';

export interface CATEGORY {
    id: string;
    name?: string;
    description?: string;
    owner?: string;
}

export type CATEGORIES = Array<CATEGORY>;


interface REQUEST {
    function?: string;
}

interface UID {
    uid: string;
}
interface KEY {
    key?: string;
}
interface CATEGORIES {
    categories: Array<string>;
}

interface POST_COMMON {
    name?: string;                  /// author name
    contact?: string;               /// author contact
    subject?: string;
    content?: string;
    sticky_forum?: boolean;
    sticky_all_forum?: boolean;
    stamp?: number;
}

// export interface POST_CREATE extends REQUEST, UID, CATEGORIES, POST_COMMON {};
// export interface POST_EDIT extends POST_CREATE, KEY {};
export interface POST extends REQUEST, UID, KEY, CATEGORIES, POST_COMMON {};
export type POSTS = Array<POST>;
