Mecánicas basadas en polaridad / magnetismo

Atracción/Repulsión: activar un campo magnético para atraer o repeler:
    *cajas metálicas,
    *plataformas móviles,
    *interruptores suspendidos.

Plataformas de polaridad:
    *Posi solo pisa plataformas “+”, Nega solo pisa “–”.
    *Si pisan la incorrecta → rebote físico.

Puentes magnéticos: atraer placas metálicas hacia el personaje para crear un puente temporal.
Cajas imantadas: pueden trepar paredes metálicas al activar campo opuesto.
Imanes rotatorios: cambiar polaridad de un imán para rotar una plataforma.

Mecánicas cooperativas (dos personajes)
    *Interruptores dobles: se requiere tener a ambos personajes en placas de presión simultáneamente.
    *Puertas con temporizador: abrir una puerta por tiempo limitado para que el otro personaje avance.
    *Paso alternado: un personaje bloquea un láser o sostiene una plataforma para que el otro pase.
    *Peso combinado: plataformas que bajan o suben según su peso conjunto.
    *Escudos cruzados: uno activa un escudo magnético que permite al otro caminar seguro.

Mecánicas de movimiento físico
    *Ramps / Slopes: impulso basado en inclinación física (Box2D).
    *Jump pads / resortes: colisión cambia velocidad vertical.
    *Plataformas móviles: físicas o cinemáticas, desplazándose por rutas definidas.
    *Poleas / cables: cajas conectadas por cuerdas físicas (joints de planck.js).
    *Balanceadores: plataformas tipo sube-y-baja que reaccionan al peso de uno u otro jugador.

Elementos físicos interactivos
    *Cajas empujables: arrastrar y empujar con fuerza real (impulsos).
    *Bolas metálicas: ruedan, caen y activan mecanismos.
    *Contrapesos: subir una plataforma bajando otra con peso.
    *Paredes rompibles: por colisiones fuertes (velocidad > umbral).
    *Rieles: objetos que solo se pueden mover en un eje.

Mecánicas de interruptores y puertas
    *Placa de presión: activa con peso mínimo → abrir puerta o mover plataforma.
    *Interruptores magnéticos: necesitan una caja imantada para activar.
    *Interruptores de tiempo: se apagan después de X segundos → obliga a ser rápido.
    *Interruptores de proximidad: se activan cuando el personaje se acerca.

Fuerzas y campos especiales
    *Campos gravitatorios: zonas donde la gravedad es distinta.
    *Gravedad invertida: cambiar la gravedad solo para un personaje.
    *Corrientes de aire: empujan al jugador hacia arriba o hacia un lado.
    *Campos de levitación: permiten mover objetos flotantes temporalmente.
    *Esferas de empuje: áreas donde los objetos son repelidos radialmente.

Mecánicas ambientales (inspiradas en Fireboy & Watergirl pero originales)
    *Ácido electromagnético: daña a un jugador dependiendo de su polaridad.
    *Ríos metálicos: flujos que empujan cajas y jugadores.
    *Plataformas energéticas: se activan solo con campo magnético activo.
    *Láseres polarizados: uno bloquea al rojo, otro al azul.

Objetivos y puzzles específicos
    *Recolectar 3 piezas magnéticas para abrir el portal final.
    *Ordenar cajas por polaridad en diferentes compartimentos.
    *Alinear imanes en ángulos específicos para dirigir una bola metálica hasta un objetivo.
    *Activar una secuencia de interruptores en orden correcto.
    *Conectar circuitos físicos empujando objetos que cierran contactos metálicos.

Desafíos lógicos integrados a física
    *Topes y bloques rotables: rotar piezas que cambian el camino de objetos.
    *Laberintos con gravedad variable: mover una bola por un laberinto físico.
    *Rutas sincronizadas: plataformas móviles que requieren timing perfecto.
    *Puzzle de masa: objetos grandes bloquean puertas pequeñas; resolver con física real.

Interacción jugador → objeto
    *Empujar + arrastrar objetos.
    *Saltar sobre interruptores físicos.
    *Activar campos magnéticos temporales.
    *Rotar objetos usando torque.
    *Lanzar objetos con fuerza medida.
