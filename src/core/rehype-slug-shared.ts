/**
 * Custom rehype-slug plugin with shared slugger support.
 *
 * Unlike the original rehype-slug which resets its internal GithubSlugger
 * on every transform call, this plugin accepts an external slugger instance
 * that maintains state across multiple process() calls. This ensures unique
 * heading IDs when processing markdown in blocks.
 *
 * When no external slugger is provided, it behaves identically to rehype-slug.
 */
import GithubSlugger from 'github-slugger';
import { headingRank } from 'hast-util-heading-rank';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

export interface RehypeSlugSharedOptions {
  /** External slugger instance shared across multiple process() calls */
  slugger?: GithubSlugger;
  /** Prefix to add in front of generated IDs */
  prefix?: string;
}

/**
 * Rehype plugin to add unique IDs to headings.
 *
 * When a shared `slugger` is provided via options, it is NOT reset between
 * transform calls, allowing unique heading IDs across independently processed blocks.
 *
 * When no `slugger` is provided, a local one is created and reset on each call,
 * matching the original rehype-slug behavior.
 */
export default function rehypeSlugShared(options?: RehypeSlugSharedOptions | null | undefined) {
  const settings = options || {};
  const prefix = settings.prefix || '';
  const externalSlugger = settings.slugger;

  // Use external slugger if provided, otherwise create a local one
  const slugger = externalSlugger || new GithubSlugger();

  return function (tree: Root): undefined {
    // Only reset if using local slugger (backward compatible with rehype-slug)
    if (!externalSlugger) {
      slugger.reset();
    }

    visit(tree, 'element', function (node) {
      if (headingRank(node) && !node.properties.id) {
        node.properties.id = prefix + slugger.slug(toString(node));
      }
    });
  };
}
