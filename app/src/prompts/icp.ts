export function buildICPPrompt(business: string, client: string): string {
  return `You are an AI assistant tasked with creating a detailed study of an ideal customer based on the provided author and context. Your goal is to generate a comprehensive profile that follows a specific structure and content. I believe my current client is:

<business>
${business}
</business>

<cliente>
${client}
</cliente>

Using these inputs, generate a detailed customer profile following these guidelines:

1. Maintain the exact structure and all sections as outlined below.
2. Adapt the content to fit the given author's expertise and the provided context.
3. Ensure all subsections are included and filled with relevant information.
4. Use creative and plausible details to flesh out the profile, staying consistent with the author's field and the context.
5. Keep the tone and style conversational where appropriate.

Your response should follow this outline:

A) DADOS DEMOGRÁFICOS
- Nome
- Idade
- Breve Descrição

B) PROBLEMA PRINCIPAL
- Problema Principal
- O Problema Principal que Enfrentam
- 5 Principais Emoções em Torno Desse Problema
- 5 Maiores Medos
- 5 Maneiras Pelas Quais Esses Medos Afetam Relacionamentos
- 5 Frases Conversacionais, Mas Ofensivas, Que Pessoas Próximas Possam Dizer

C) OUTRAS SOLUÇÕES
- O Que Tentaram no Passado (Liste 5-6 Soluções Diferentes)
- Breves Trechos de Conversas Sobre o Que Tentaram no Passado
- O Que Não Querem Fazer para Resolver Seu Problema
- Breves Trechos de Conversas Sobre o que Não Querem Fazer

D) TRANSFORMAÇÃO PRIMÁRIA
- Se um Gênio Pudesse Estalar os Dedos e Dar-lhes a Solução Perfeita, Como Seria a Vida Deles?
- Como Isso Afetaria 3-4 de Seus Relacionamentos Mais Próximos?

E) ESPECIFICIDADES DO MERCADO
- Em Que o Prospecto Baseia o Seu Sucesso?
- Do Que o Prospecto Tem que Abrir Mão ao Por Conta dos Problemas que Enfrenta?
- Quem o Prospecto Culpa por Seu Problema?
- Quais São as 5 Maiores Objeções que o Mercado Pode Ter em Relação ao Problema Deles?

F) EJACA
- Encorajar seus sonhos
- Justificar seus erros
- Aliviar seus medos
- Confirmar suas suspeitas
- Apontar a culpa para seus inimigos

G) SUBMERCADOS
- Submercado 1
- Submercado 2
- Submercado 3
- Submercado 4
- Submercado 5

Ensure that you maintain the exact structure, including all bullet points, numbering, and formatting as shown in the outline. Your response should be detailed, creative, and tailored to the specific author and context provided.

Present your entire response within <answer> tags.`;
}
