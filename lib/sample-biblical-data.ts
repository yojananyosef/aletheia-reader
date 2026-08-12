import { ChapterPayload } from '@/types/bible';

export const SAMPLE_CHAPTERS: ChapterPayload[] = [
  {
    bookId: 'GEN',
    bookName: 'Génesis',
    chapterNumber: 1,
    footnotes: [
      {
        id: 'fn-gen-1-1',
        verseNumber: 1,
        note: 'Hebreo: Bereshit. Alude al origen primordial del cosmos por decreto divino.'
      },
      {
        id: 'fn-gen-1-2',
        verseNumber: 2,
        note: 'Tohu va-vohu: Término hebreo para "desordenada y vacía", describiendo el estado primordial antes de la estructuración creadora.'
      },
      {
        id: 'fn-gen-1-26',
        verseNumber: 26,
        note: 'Tselem Elohim: "A imagen de Dios", designando dignidad intrínseca, vocación de mayordomía y comunión moral.'
      }
    ],
    verses: [
      { number: 1, text: 'En el principio creó Dios los cielos y la tierra.' },
      { number: 2, text: 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.' },
      { number: 3, text: 'Y dijo Dios: Sea la luz; y fue la luz.' },
      { number: 4, text: 'Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.' },
      { number: 5, text: 'Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.' },
      { number: 6, text: 'Luego dijo Dios: Haya expansión en medio de las aguas, y separe las aguas de las aguas.' },
      { number: 7, text: 'E hizo Dios la expansión, y separó las aguas que estaban debajo de la expansión, de las aguas que estaban sobre la expansión. Y fue así.' },
      { number: 8, text: 'Y llamó Dios a la expansión Cielos. Y fue la tarde y la mañana el día segundo.' },
      { number: 9, text: 'Dijo también Dios: Júntense las aguas que están debajo de los cielos en un lugar, y descúbrase lo seco. Y fue así.' },
      { number: 10, text: 'Y llamó Dios a lo seco Tierra, y a la reunión de las aguas llamó Mares. Y vio Dios que era bueno.' },
      { number: 11, text: 'Después dijo Dios: Produzca la tierra hierba verde, hierba que dé semilla; árbol de fruto que dé fruto según su género, que su semilla esté en él, sobre la tierra. Y fue así.' },
      { number: 12, text: 'Produjo, pues, la tierra hierba verde, hierba que da semilla según su naturaleza, y árbol que da fruto, cuya semilla está en él, según su género. Y vio Dios que era bueno.' },
      { number: 13, text: 'Y fue la tarde y la mañana el día tercero.' },
      { number: 14, text: 'Dijo luego Dios: Haya lumbreras en la expansión de los cielos para separar el día de la noche; y sirvan de señales para las estaciones, para días y años,' },
      { number: 15, text: 'y sean por lumbreras en la expansión de los cielos para alumbrar sobre la tierra. Y fue así.' },
      { number: 16, text: 'E hizo Dios las dos grandes lumbreras; la lumbrera mayor para que señorease en el día, y la lumbrera menor para que señorease en la noche; hizo también las estrellas.' },
      { number: 17, text: 'Y las puso Dios en la expansión de los cielos para alumbrar sobre la tierra,' },
      { number: 18, text: 'y para señorear en el día y en la noche, y para separar la luz de las tinieblas. Y vio Dios que era bueno.' },
      { number: 19, text: 'Y fue la tarde y la mañana el día cuarto.' },
      { number: 20, text: 'Dijo Dios: Produzcan las aguas seres vivientes, y aves que vuelen sobre la tierra, en la abierta expansión de los cielos.' },
      { number: 21, text: 'Y creó Dios los grandes monstruos marinos, y todo ser viviente que se mueve, que las aguas produjeron según su género, y toda ave alada según su especie. Y vio Dios que era bueno.' },
      { number: 22, text: 'Y Dios los bendijo, diciendo: Fructificad y multiplicaos, y llenad las aguas en los mares, y multiplíquense las aves en la tierra.' },
      { number: 23, text: 'Y fue la tarde y la mañana el día quinto.' },
      { number: 24, text: 'Luego dijo Dios: Produzca la tierra seres vivientes según su género, bestias y serpientes y animales de la tierra según su especie. Y fue así.' },
      { number: 25, text: 'E hizo Dios animales de la tierra según su género, y ganado según su género, y todo animal que se arrastra sobre la tierra según su especie. Y vio Dios que era bueno.' },
      { number: 26, text: 'Entonces dijo Dios: Hagamos al hombre a nuestra imagen, conforme a nuestra semejanza; y señoree en los peces del mar, en las aves de los cielos, en las bestias, en toda la tierra, y en todo animal que se arrastra sobre la tierra.' },
      { number: 27, text: 'Y creó Dios al hombre a su imagen, a imagen de Dios lo creó; varón y hembra los creó.' },
      { number: 28, text: 'Y los bendijo Dios, y les dijo: Fructificad y multiplicaos; llenad la tierra, y sojuzgadla, y señoread en los peces del mar, en las aves de los cielos, y en todas las bestias que se mueven sobre la tierra.' },
      { number: 29, text: 'Y dijo Dios: He aquí que os he dado toda planta que da semilla, que está sobre toda la tierra, y todo árbol en que hay fruto y que da semilla; os serán para comer.' },
      { number: 30, text: 'Y a toda bestia de la tierra, y a todas las aves de los cielos, y a todo lo que se arrastra sobre la tierra, en que hay vida, toda planta verde les será para comer. Y fue así.' },
      { number: 31, text: 'Y vio Dios todo lo que había hecho, y he aquí que era bueno en gran manera. Y fue la tarde y la mañana el día sexto.' }
    ]
  },
  {
    bookId: 'PSA',
    bookName: 'Salmos',
    chapterNumber: 23,
    footnotes: [
      {
        id: 'fn-psa-23-1',
        verseNumber: 1,
        note: 'Hebreo: YHWH Ro\'i. Metáfora del pastor que evoca cuidado tierno, protección total y provisión soberana.'
      },
      {
        id: 'fn-psa-23-4',
        verseNumber: 4,
        note: 'Tsalmavet: Sombra de muerte o tiniebla profunda. La vara servía para defender del depredador y el cayado para guiar con suavidad al rebaño.'
      }
    ],
    verses: [
      { number: 1, text: 'Jehová es mi pastor; nada me faltará.' },
      { number: 2, text: 'En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.' },
      { number: 3, text: 'Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.' },
      { number: 4, text: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.' },
      { number: 5, text: 'Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando.' },
      { number: 6, text: 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.' }
    ]
  },
  {
    bookId: 'JHN',
    bookName: 'Juan',
    chapterNumber: 1,
    footnotes: [
      {
        id: 'fn-jhn-1-1',
        verseNumber: 1,
        note: 'Griego: Logos. Conecta con el concepto filosófico y veterotestamentario de la Palabra viva y creadora de Dios.'
      },
      {
        id: 'fn-jhn-1-14',
        verseNumber: 14,
        note: 'Eskēnōsen: Literalmente "puso su tabernáculo entre nosotros", aludiendo a la presencia divina manifiesta en el Éxodo.'
      }
    ],
    verses: [
      { number: 1, text: 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.' },
      { number: 2, text: 'Este era en el principio con Dios.' },
      { number: 3, text: 'Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.' },
      { number: 4, text: 'En él estaba la vida, y la vida era la luz de los hombres.' },
      { number: 5, text: 'La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.' },
      { number: 6, text: 'Hubo un hombre enviado de Dios, el cual se llamaba Juan.' },
      { number: 7, text: 'Este vino por testimonio, para que diese testimonio de la luz, a fin de que todos creyesen por él.' },
      { number: 8, text: 'No era él la luz, sino para que diese testimonio de la luz.' },
      { number: 9, text: 'Aquella luz verdadera, que alumbra a todo hombre, venía a este mundo.' },
      { number: 10, text: 'En el mundo estaba, y el mundo por él fue hecho; pero el mundo no le conoció.' },
      { number: 11, text: 'A lo suyo vino, y los suyos no le recibieron.' },
      { number: 12, text: 'Mas a todos los que le recibieron, a los que creen en su nombre, les dio potestad de ser hechos hijos de Dios;' },
      { number: 13, text: 'los cuales no son engendrados de sangre, ni de voluntad de carne, ni de voluntad de varón, sino de Dios.' },
      { number: 14, text: 'Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad.' },
      { number: 15, text: 'Juan dio testimonio de él, y clamó diciendo: Este es de quien yo decía: El que viene después de mí, es antes de mí; porque era primero que yo.' },
      { number: 16, text: 'Porque de su plenitud tomamos todos, y gracia sobre gracia.' },
      { number: 17, text: 'Pues la ley por medio de Moisés fue dada, pero la gracia y la verdad vinieron por medio de Jesucristo.' },
      { number: 18, text: 'A Dios nadie le vio jamás; el unigénito Hijo, que está en el seno del Padre, él le ha dado a conocer.' }
    ]
  },
  {
    bookId: 'ROM',
    bookName: 'Romanos',
    chapterNumber: 8,
    footnotes: [
      {
        id: 'fn-rom-8-1',
        verseNumber: 1,
        note: 'Griego: Katakrima. Ausencia total de veredicto condenatorio judicial para quienes están unidos a Cristo.'
      },
      {
        id: 'fn-rom-8-26',
        verseNumber: 26,
        note: 'Stenagmois alalētois: "Gemidos indecibles", indicando la intercesión íntima del Espíritu en la debilidad humana.'
      }
    ],
    verses: [
      { number: 1, text: 'Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu.' },
      { number: 2, text: 'Porque la ley del Espíritu de vida en Cristo Jesús me ha librado de la ley del pecado y de la muerte.' },
      { number: 3, text: 'Porque lo que era imposible para la ley, por cuanto era débil por la carne, Dios, enviando a su Hijo en semejanza de carne de pecado y a causa del pecado, condenó al pecado en la carne;' },
      { number: 4, text: 'para que la justicia de la ley se cumpliese en nosotros, que no andamos conforme a la carne, sino conforme al Espíritu.' },
      { number: 5, text: 'Porque los que son de la carne piensan en las cosas de la carne; pero los que son del Espíritu, en las cosas del Espíritu.' },
      { number: 6, text: 'Porque el ocuparse de la carne es muerte, pero el ocuparse del Espíritu es vida y paz.' },
      { number: 7, text: 'Por cuanto los designios de la carne son enemistad contra Dios; porque no se sujetan a la ley de Dios, ni tampoco pueden;' },
      { number: 8, text: 'y los que viven según la carne no pueden agradar a Dios.' },
      { number: 9, text: 'Mas vosotros no vivís según la carne, sino según el Espíritu, si es que el Espíritu de Dios mora en vosotros. Y si alguno no tiene el Espíritu de Cristo, no es de él.' },
      { number: 10, text: 'Pero si Cristo está en vosotros, el cuerpo en verdad está muerto a causa del pecado, mas el espíritu vive a causa de la justicia.' },
      { number: 11, text: 'Y si el Espíritu de aquel que levantó de los muertos a Jesús mora en vosotros, el que levantó de los muertos a Cristo Jesús vivificará también vuestros cuerpos mortales por su Espíritu que mora en vosotros.' },
      { number: 12, text: 'Así que, hermanos, deudores somos, no a la carne, para que vivamos conforme a la carne;' },
      { number: 13, text: 'porque si vivís conforme a la carne, moriréis; mas si por el Espíritu hacéis morir las obras de la carne, viviréis.' },
      { number: 14, text: 'Porque todos los que son guiados por el Espíritu de Dios, éstos son hijos de Dios.' },
      { number: 15, text: 'Pues no habéis recibido el espíritu de servidumbre para estar otra vez en temor, sino que habéis recibido el espíritu de adopción, por el cual clamamos: ¡Abba, Padre!' },
      { number: 16, text: 'El Espíritu mismo da testimonio a nuestro espíritu, de que somos hijos de Dios.' },
      { number: 17, text: 'Y si hijos, también herederos; herederos de Dios y coherederos con Cristo, si es que padecemos juntamente con él, para que juntamente con él seamos glorificados.' },
      { number: 18, text: 'Pues tengo por cierto que las aflicciones del tiempo presente no son comparables con la gloria venidera que en nosotros ha de manifestarse.' },
      { number: 26, text: 'Y de igual manera el Espíritu nos ayuda en nuestra debilidad; pues qué hemos de pedir como conviene, no lo sabemos, pero el Espíritu mismo intercede por nosotros con gemidos indecibles.' },
      { number: 28, text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.' },
      { number: 31, text: '¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?' },
      { number: 37, text: 'Antes, en todas estas cosas somos más que vencedores por medio de aquel que nos amó.' },
      { number: 38, text: 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir,' },
      { number: 39, text: 'ni lo alto, ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.' }
    ]
  },
  {
    bookId: '1CO',
    bookName: '1 Corintios',
    chapterNumber: 13,
    footnotes: [
      {
        id: 'fn-1co-13-1',
        verseNumber: 1,
        note: 'Griego: Agapē. El amor desinteresado, sacrificial e incondicional de origen divino.'
      }
    ],
    verses: [
      { number: 1, text: 'Si yo hablase lenguas humanas y angélicas, y no tengo amor, vengo a ser como metal que resuena, o címbalo que retiñe.' },
      { number: 2, text: 'Y si tuviese profecía, y entendiese todos los misterios y toda ciencia, y si tuviese toda la fe, de tal manera que trasladase los montes, y no tengo amor, nada soy.' },
      { number: 3, text: 'Y si repartiese todos mis bienes para dar de comer a los pobres, y si entregase mi cuerpo para ser quemado, y no tengo amor, de nada me sirve.' },
      { number: 4, text: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece;' },
      { number: 5, text: 'no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor;' },
      { number: 6, text: 'no se goza de la injusticia, mas se goza de la verdad.' },
      { number: 7, text: 'Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.' },
      { number: 8, text: 'El amor nunca deja de ser; pero las profecías se acabarán, y cesarán las lenguas, y la ciencia acabará.' },
      { number: 13, text: 'Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.' }
    ]
  }
];
