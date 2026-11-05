/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

declare namespace App {
  interface Locals {
    /** True while rendering a draft preview inside Sanity Presentation */
    preview: boolean;
  }
}
