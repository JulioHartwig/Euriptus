const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
 const users = await p.user.findMany({ select: { nome: true, email: true, role: true, empresa: { select: { nome: true, tipo: true, saldo: true } } }, orderBy: { role: 'asc' } });
 console.log(users.map(u => ({ ...u, empresa: u.empresa ? { ...u.empresa, saldo: u.empresa.saldo.toString() } : null })));
 await p.$disconnect();
})();
