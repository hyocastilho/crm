"""Dados e login de demonstração.

Este pacote existe só para a etapa sem WhatsApp e Instagram reais.
Para remover depois da integração: python manage.py clear_demo
e apague a pasta back/crm/demo junto com os comandos seed_demo e clear_demo.
"""

DEMO_KEY = "loja-aurora"
DEMO_BUSINESS_NAME = "Loja Aurora"

DEMO = [
    {
        "name": "Ana Beatriz Souza",
        "phone": "+55 92 98111-0101",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "novo",
        "status": "aberta",
        "minutes": 10,
        "messages": [
            ("in", "customer", "Oi! Vocês têm a bolsa azul em estoque?", 12),
            ("out", "human", "Oi, Ana! Temos sim, chegou ontem.", 10),
        ],
    },
    {
        "name": "Carlos Menezes",
        "phone": "+55 92 98111-0202",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "em_atendimento",
        "status": "aberta",
        "minutes": 40,
        "messages": [
            ("in", "customer", "Bom dia, qual o prazo de entrega para Manaus?", 50),
            ("out", "human", "Bom dia! De 2 a 3 dias úteis.", 40),
        ],
    },
    {
        "name": "Daniela Rocha",
        "phone": "",
        "instagram": "dani.rocha",
        "source": "instagram",
        "channel": "instagram",
        "stage": "orcamento",
        "status": "aguardando",
        "minutes": 120,
        "messages": [
            ("in", "customer", "Consegue me mandar o orçamento de 3 peças?", 180),
            ("out", "human", "Claro, envio ainda hoje o valor fechado.", 120),
        ],
    },
    {
        "name": "Eduardo Lima",
        "phone": "+55 92 98111-0404",
        "instagram": "",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "pedido",
        "status": "aberta",
        "minutes": 300,
        "messages": [("in", "customer", "Fechado, pode separar o pedido.", 300)],
    },
    {
        "name": "Fernanda Prado",
        "phone": "",
        "instagram": "fefe.prado",
        "source": "instagram",
        "channel": "instagram",
        "stage": "pago",
        "status": "encerrada",
        "minutes": 60 * 24,
        "messages": [("out", "human", "Pagamento confirmado, obrigado!", 60 * 24)],
    },
    {
        "name": "Gustavo Aragão",
        "phone": "+55 92 98111-0606",
        "instagram": "gu.aragao",
        "source": "whatsapp",
        "channel": "whatsapp",
        "stage": "perdido",
        "status": "encerrada",
        "minutes": 60 * 48,
        "messages": [("in", "customer", "Por enquanto vou deixar para depois.", 60 * 48)],
    },
    {
        "name": "Helena Castro",
        "phone": "",
        "instagram": "helena.castro",
        "source": "instagram",
        "channel": "instagram",
        "stage": "novo",
        "status": "aberta",
        "minutes": 25,
        "messages": [("in", "customer", "Vi o post do vestido, ainda tem P?", 25)],
    },
    {
        "name": "Igor Nascimento",
        "phone": "+55 92 98111-0808",
        "instagram": "",
        "source": "manual",
        "channel": "whatsapp",
        "stage": "em_atendimento",
        "status": "aguardando",
        "minutes": 180,
        "messages": [("in", "customer", "Consigo trocar a cor do pedido?", 180)],
    },
]
