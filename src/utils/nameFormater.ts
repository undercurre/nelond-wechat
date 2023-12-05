export function formLimitString(str: string, maxLength: number, startLength: number, endLength: number): string {
  if (str.length <= maxLength) {
    if (startLength + endLength >= str.length) {
      return str;
    } else {
      return `${str.substring(0, startLength)}...${str.substring(str.length - endLength)}`;
    }
  } else {
    if (startLength + endLength >= maxLength) {
      return str.substring(0, maxLength);
    } else {
      return `${str.substring(0, startLength)}...${str.substring(str.length - endLength)}`;
    }
  }
}