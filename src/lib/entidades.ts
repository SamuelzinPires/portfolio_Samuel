// Escreve cada caractere como entidade HTML (&#115;&#97;…). O navegador decodifica sozinho,
// sem JavaScript, mas o texto original não aparece literal no HTML.
export const entidades = (texto: string) => [...texto].map((c) => `&#${c.codePointAt(0)};`).join('');
