/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
export const syntaxHighlight = (json: string) => {
  if (!json) return '';
  let formatted = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return formatted.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-blue-600 dark:text-blue-400'; // number
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-gray-900 dark:text-gray-100 font-semibold'; // key
      } else {
        cls = 'text-green-600 dark:text-green-400'; // string
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-purple-600 dark:text-purple-400'; // boolean
    } else if (/null/.test(match)) {
      cls = 'text-gray-500 dark:text-gray-400 italic'; // null
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
};

export const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
