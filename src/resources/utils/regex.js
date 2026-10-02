export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const phoneRegex = /^[0-9]{10,15}$/;

export const formRegEx = /([a-z])([A-Z0-9])|([A-Za-z])([0-9])/g;

export const formRegExReplacer = "$1$3 $2$4";
