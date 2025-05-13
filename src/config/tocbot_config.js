import tocbot from "tocbot";
const MIN_HEADER_HEIGHT = 100;
let tocbotTntervalId = 0;

export const defautTocBotOptions = {
  //tocSelector: ".active .summary__nav", // where to render the table of contents
  tocSelector: `.summary__nav`, // where to render the table of contents
  contentSelector: `.summary__display`, // where to grab the headings to build the table of contents
  headingSelector: "h2, h3", // which headings to grab inside of the contentSelector element
  positionFixedSelector: `.summary__nav`, // element to add the positionFixedClass to
  ignoreSelector: "h3.panel-title, .js-toc-ignore",
  collapseDepth: 0, // how many heading levels should not be collpased
  includeHtml: true, // include the HTML markup from the heading node, not just the text,
  headingsOffset: 1 * MIN_HEADER_HEIGHT,
  scrollSmoothOffset: -1 * MIN_HEADER_HEIGHT,
  hasInnerContainers: true,
  fixedSidebarOffset: "auto",
  onClick: (e) => {
    e.preventDefault();
    const sectionIdAttr = "datasectionid";
    const containgElement = e.target.closest(`[${sectionIdAttr}]`);
    const sectionId = containgElement
      ? containgElement.getAttribute(sectionIdAttr)
      : e.target.getAttribute(sectionIdAttr);
    //e.stopPropagation();
    const anchorElement = document.querySelector(`#${sectionId}__anchor`);
    const listItems = document.querySelectorAll(".toc-list-item");
    const activeListItem = e.target.closest(".toc-list-item");
    const tocLinks = document.querySelectorAll(".toc-link");
    const activeLink = e.target.closest(".toc-link");
    if (anchorElement) {
      anchorElement.scrollIntoView(true);
    } else {
      e.target.scrollIntoView(true);
    }
    clearTimeout(tocbotTntervalId);
    tocbotTntervalId = setTimeout(() => {
      tocLinks.forEach((el) => {
        if (el.isEqualNode(activeLink)) {
          el.classList.add("is-active-link");
          return true;
        }
        el.classList.remove("is-active-link");
      });
      listItems.forEach((el) => {
        if (el.isEqualNode(activeListItem)) {
          el.classList.add("is-active-li");
          return true;
        }
        el.classList.remove("is-active-li");
      });
    }, 150);
  },
};

export const initTocBot = (options) => {
  try {
    tocbot.init({
      ...defautTocBotOptions,
      ...options,
    });
  } catch (e) {
    console.log("Error initializing tocbot ", e);
  }
};

export const destroyTocBot = () => {
  clearTimeout(tocbotTntervalId);
  tocbot.destroy();
};

export const refreshTocBot = () => {
  try {
    tocbot.refresh();
  } catch(e) {
    console.log("tocbot refresh error ", e);
  }
};
