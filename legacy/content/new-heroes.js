"use strict";
// Legacy adaptations: percent damage, bounded knockback and ring-out, never Battleground HP.
const NEW_HERO_IDS = [];
function arenaSkill(name, cd, desc, use, extra = {}) {
  return {
    name,
    cd,
    desc,
    ai: { type: "atk", max: 400, pri: 1 },
    use,
    ...extra,
  };
}
function registerArenaHero(id, name, color, role, gfx, definition) {
  const weapon = "arena_" + id;
  WEAPONS[weapon] = {
    name,
    icon: "✦",
    color,
    role,
    gfx,
    weight: 1,
    speed: 1,
    ai: { range: 150, defend: ["C"] },
    passive: { name: role, desc: definition.passive || role },
    init(f) {
      f.ws.resource = 0;
      definition.init?.(f);
    },
    ...definition,
  };
  WEAPONS[weapon].skills.E ||= arenaSkill(
    "Né bước",
    3,
    "Lướt ngắn theo hướng ngắm, không tự cứu khi đã rơi đài.",
    (f, m) => arenaDash(f, m, 90),
    { ai: { type: "mob", mob: "escape", max: 150 } },
  );
  const hero = {
    id,
    name,
    color,
    weapon,
    group: "Đấu trường mở rộng",
    role,
    style: role,
    bio: definition.passive || role,
  };
  ROSTER.push(hero);
  ROSTER_BY_ID[id] = hero;
  CHAR_BY_WEAPON[weapon] = hero;
  NEW_HERO_IDS.push(id);
}
function arenaArc(f, m, tag, range = 105, dmg = 7, kb = 140, extra = {}) {
  return m.hitArc(f, {
    tag,
    range,
    arc: 110,
    dmg,
    kb,
    kg: tag === "B" ? 6 : 3.5,
    angle: f.castAngle,
    ...extra,
  });
}
function arenaBolt(f, m, tag, dmg = 6, extra = {}) {
  if (m.projs.length >= 160) return null;
  return shoot(f, m, f.castAngle, {
    kind: "bullet",
    color: f.color,
    speed: 650,
    range: 500,
    r: 7,
    hit: { tag, dmg, kb: 90, kg: 3, ...extra.hit },
    ...extra,
  });
}
function arenaDash(f, m, distance = 140, extra = {}) {
  f.startDash({
    angle: f.castAngle,
    dist: distance,
    dur: 0.22,
    trail: true,
    ...extra,
  });
}
function arenaPoint(f, m, range = 220) {
  return m.arena.clamp(
    {
      x: f.x + Math.cos(f.castAngle) * range,
      y: f.y + Math.sin(f.castAngle) * range,
    },
    12,
  );
}
function arenaTeleport(f, m, p) {
  if (!f.alive || !p || ![p.x, p.y].every(Number.isFinite)) return false;
  const target = m.arena.clamp({ x: p.x, y: p.y }, 10);
  if (m.arena.nearPillar({ ...target, r: f.r }, 0)) return false;
  f.cancelDash();
  f.x = target.x;
  f.y = target.y;
  f.vx = f.vy = 0;
  return true;
}
function arenaDelayed(f, m, delay, fn) {
  const life = f.lifeEpoch;
  m.later(delay, () => {
    if (f.alive && f.lifeEpoch === life) fn();
  });
}
function arenaBurst(
  f,
  m,
  tag,
  p,
  r = 90,
  dmg = 12,
  kb = 220,
  delay = 0.5,
  extra = {},
) {
  m.dangers.push({ x: p.x, y: p.y, r, t: delay });
  m.fx({ type: "telegraph", x: p.x, y: p.y, r, color: f.color, life: delay });
  arenaDelayed(f, m, delay, () => {
    m.hitCircle(f, { tag, x: p.x, y: p.y, r, dmg, kb, kg: 5, ...extra });
    m.fx({ type: "boom", x: p.x, y: p.y, r, color: f.color, life: 0.5 });
  });
}
function arenaZone(
  f,
  m,
  p,
  { r = 120, life = 4, dmg = 2, pull = 0, slow = 0, heal = 0 } = {},
) {
  const epoch = f.lifeEpoch;
  return m.zone({
    owner: f,
    x: p.x,
    y: p.y,
    r,
    life,
    every: 0.5,
    kind: pull ? "vortex" : "magic",
    color: f.color,
    tick(mm, z) {
      if (!f.alive || f.lifeEpoch !== epoch) {
        z.life = 0;
        return;
      }
      for (const enemy of mm.enemiesOf(f))
        if (dist(enemy, z) < r) {
          mm.applyHit(f, enemy, {
            tag: "U",
            dmg,
            kb: pull ? 45 : 0,
            kg: 0,
            quiet: true,
            angle: pull ? angTo(enemy, z) : angTo(z, enemy),
          });
          if (slow) enemy.addStatus("slow", 0.65, slow);
        }
      if (heal && dist(f, z) < r) f.percent = Math.max(0, f.percent - heal);
    },
  });
}
function arenaShield(f, amount = 10, time = 3) {
  f.addStatus("shield", time, amount);
}
function arenaFaith(f, amount) {
  f.ws.faith = clamp((f.ws.faith || 0) + amount, 0, 100);
}
function arenaEcho(f, m, life = 6, scale = 0.35) {
  const existing = m.minions.filter(
    (e) => e.owner === f && e.kind === "arena_echo",
  );
  if (existing.length >= 3) m.removeMinion(existing[0]);
  const echo = new Minion(
    f,
    "arena_echo",
    f.x + rand(-35, 35),
    f.y + rand(-35, 35),
    f.name + " · Ảo ảnh",
  );
  echo.color = f.color;
  echo.life = life;
  echo.ws.scale = scale;
  echo.competitive = true;
  m.addMinion(echo);
  return echo;
}
WEAPONS.arena_echo = {
  name: "Ảo ảnh",
  color: "#c6a4ff",
  gfx: "dagger",
  weight: 0.7,
  speed: 1,
  radius: 15,
  skills: {},
  init(f) {
    f.ws.shot = 0;
  },
  mind(e, m, dt) {
    e.life -= dt;
    if (e.life <= 0 || !e.owner.alive) {
      m.removeMinion(e);
      return;
    }
    const target = m.nearestEnemy(e);
    if (!target) return;
    const a = angTo(e, target);
    e.facing = a;
    e.castAngle = a;
    e.moveDir = dist(e, target) > 170 ? fromAng(a) : { x: 0, y: 0 };
    e.ws.shot -= dt;
    if (e.ws.shot <= 0) {
      e.ws.shot = 0.9;
      arenaBolt(e, m, "A", 5 * (e.ws.scale || 0.35), {
        angle: a,
        range: 360,
        hit: { tag: "A", dmg: 5 * (e.ws.scale || 0.35), kb: 45, kg: 1 },
      });
    }
  },
};

registerArenaHero("boran", "Boran", "#93d5ec", "Đấu sĩ · Băng Cổ", "claw", {
  weight: 1.35,
  speed: 0.9,
  passive:
    "Đòn trúng tích tối đa 12 Băng Cổ. Băng tăng trụ vững; D tiêu băng làm khiên.",
  init(f) {
    f.ws.ice = 0;
    f.ws.beast = 0;
  },
  resource: (f) => `❄ ${f.ws.ice}/12`,
  onDeal(f) {
    f.ws.ice = Math.min(12, f.ws.ice + 1);
  },
  update(f, m, dt) {
    f.frameWeight *= 1 + f.ws.ice * 0.018;
    if (f.ws.beast > 0) {
      f.ws.beast -= dt;
      f.frameWeight *= 1.3;
      f.frameSpeed *= 1.15;
    }
  },
  skills: {
    A: arenaSkill(
      "Song Rìu Phi Phao",
      0.7,
      "Hai rìu bay chéo, tích Băng Cổ khi trúng.",
      (f, m) => {
        for (const off of [-0.12, 0.12])
          arenaBolt(f, m, "A", 4, { angle: f.castAngle + off, kind: "knife" });
      },
    ),
    B: arenaSkill(
      "Cuồng Phong Băng Trảm",
      4,
      "Xoay rìu 360°, lực đẩy tăng khi Băng Ma còn hiệu lực.",
      (f, m) =>
        m.hitCircle(f, {
          r: 115,
          dmg: 10,
          kb: f.ws.beast > 0 ? 270 : 210,
          kg: 6,
          tag: "B",
          slow: [1, 0.3],
        }),
    ),
    C: arenaSkill(
      "Tuyết Lở Áp Sát",
      6,
      "Lao theo hướng ngắm và húc kẻ đầu tiên.",
      (f, m) =>
        arenaDash(f, m, 180, {
          onContact: (e) => {
            m.applyHit(f, e, {
              tag: "C",
              dmg: 7,
              kb: 180,
              kg: 3,
              stun: 0.4,
              angle: f.castAngle,
            });
            return true;
          },
        }),
    ),
    D: arenaSkill(
      "Thể Trọng Băng Hóa",
      8,
      "Tiêu Băng Cổ, tạo khiên tối đa 14 điểm và Thiết Thân 1s.",
      (f) => {
        arenaShield(f, Math.min(14, 4 + f.ws.ice));
        f.ws.ice = 0;
        f.addStatus("ironbody", 1);
      },
    ),
    U: arenaSkill(
      "Thức Tỉnh Băng Ma",
      18,
      "Biến hình 7s, đẩy lùi mạnh và tăng trụ vững; vẫn có thể rơi đài.",
      (f, m) => {
        f.ws.beast = 7;
        m.hitCircle(f, { r: 140, dmg: 16, kb: 260, kg: 5, tag: "U" });
      },
    ),
  },
});
registerArenaHero(
  "ariston",
  "Ariston",
  "#e8d5a6",
  "Đỡ đòn · Đức Tin",
  "greatsword",
  {
    weight: 1.4,
    speed: 0.88,
    passive:
      "Đánh trúng tích Đức Tin, cầu nguyện giảm điểm văng hữu hạn. Không miễn rơi đài.",
    init(f) {
      f.ws.faith = 20;
    },
    resource: (f) => `✦ ${Math.floor(f.ws.faith)}/100`,
    onDeal: (f) => arenaFaith(f, 8),
    skills: {
      A: arenaSkill(
        "Thiết Trảm: Liệt Đao",
        0.8,
        "Bổ kiếm phía trước và tích Đức Tin.",
        (f, m) => arenaArc(f, m, "A", 120, 9, 120),
      ),
      B: arenaSkill(
        "Đại Kiếm Trọng Lực",
        4,
        "Bổ nặng có báo trước, tầm ngắn và lực đẩy cao.",
        (f, m) => {
          f.act(0.55, { move: 0.2, anim: "swing", atk: true }, [
            [0.35, () => arenaArc(f, m, "B", 135, 14, 285)],
          ]);
        },
      ),
      C: arenaSkill(
        "Thế Thủ Thánh Quan",
        6,
        "Giơ thế thủ 1.2s. Đòn cận chiến bị chặn tạo cơ hội phản công.",
        (f) => f.addStatus("stance", 1.2),
      ),
      D: arenaSkill(
        "Lời Nguyện Bất Diệt",
        9,
        "Tiêu 20 Đức Tin, đứng cầu nguyện; giảm tối đa 12 điểm văng, bị đánh thì ngắt.",
        (f, m) => {
          f.ws.faith -= 20;
          const hurt = f.lastHurtT;
          f.act(1.5, { move: 0 }, [
            [
              1.4,
              () => {
                if (f.lastHurtT === hurt)
                  f.percent = Math.max(0, f.percent - 12);
              },
            ],
          ]);
        },
        { can: (f) => f.ws.faith >= 20, ai: { type: "buff", max: 1000 } },
      ),
      U: arenaSkill(
        "Đại Phán Quyết",
        18,
        "Phán quyết có cảnh báo. Lực đẩy tăng theo điểm văng, không xử KO tự động.",
        (f, m) =>
          arenaBurst(f, m, "U", arenaPoint(f, m, 140), 100, 20, 330, 0.65),
      ),
    },
  },
);
registerArenaHero(
  "vector",
  "Dr. Vector",
  "#69e3ff",
  "Xạ thủ · Laser",
  "rifle",
  {
    ai: { range: 330, defend: ["C"], ranged: true },
    passive: "Băng 8 viên laser. D nạp đầy; khi băng đã đầy, D bật radar.",
    init(f) {
      f.ws.ammo = 8;
      f.ws.reload = 0;
    },
    resource: (f) => `▣ ${f.ws.ammo}/8`,
    update(f, m, dt) {
      if (f.ws.ammo === 0) {
        f.ws.reload += dt;
        if (f.ws.reload >= 2.5) {
          f.ws.ammo = 8;
          f.ws.reload = 0;
        }
      }
    },
    skills: {
      A: arenaSkill(
        "Laser Gun",
        0.35,
        "Laser theo hướng người chơi, tốn một viên.",
        (f, m) => {
          f.ws.ammo--;
          arenaBolt(f, m, "A", 6, {
            speed: 1200,
            ghost: true,
            color: "#6eeaff",
          });
        },
        { can: (f) => f.ws.ammo > 0 },
      ),
      B: arenaSkill(
        "Tia Khóa Tọa Độ",
        4,
        "Tia thẳng xuyên cột, báo trước 0.35s.",
        (f, m) => {
          const a = f.castAngle;
          f.act(0.45, { move: 0.3, anim: "shoot" }, [
            [
              0.35,
              () =>
                m.hitLine(f, {
                  len: 500,
                  w: 24,
                  angle: a,
                  dmg: 12,
                  kb: 250,
                  kg: 5,
                  tag: "B",
                }),
            ],
          ]);
        },
      ),
      C: arenaSkill(
        "Bom Từ Tính",
        7,
        "Nổ chậm tại điểm ngắm, choáng và tạo vùng cấm lướt.",
        (f, m) => {
          const p = arenaPoint(f, m, 210);
          arenaBurst(f, m, "C", p, 80, 8, 100, 0.6, { stun: 0.6 });
          arenaDelayed(f, m, 0.6, () => {
            for (const e of m.enemiesOf(f))
              if (dist(e, p) < 80) e.addStatus("nodash", 2);
          });
        },
      ),
      D: arenaSkill(
        "Tái Kích / Radar",
        6,
        "Hết đạn: nạp ngay. Đầy đạn: hiện kẻ ẩn trong 350px và tăng tốc 2s.",
        (f, m) => {
          if (f.ws.ammo < 8) {
            f.ws.ammo = 8;
            f.ws.reload = 0;
          } else {
            f._seeAll = m.time + 3;
            f.addStatus("haste", 2, 0.25);
            arenaShield(f, 8);
            for (const e of m.enemiesOf(f))
              if (dist(f, e) < 350) e.removeStatus("invis");
          }
        },
      ),
      U: arenaSkill(
        "Pháo Laser Quét Hư Không",
        20,
        "Tụ lực 0.65s, laser xuyên cột với lực đẩy lớn.",
        (f, m) => {
          const a = f.castAngle;
          f.act(0.85, { move: 0, anim: "shoot", charge: 0.65 }, [
            [
              0.65,
              () =>
                m.hitLine(f, {
                  len: 650,
                  w: 42,
                  angle: a,
                  dmg: 22,
                  kb: 310,
                  kg: 6,
                  tag: "U",
                  unblockable: true,
                }),
            ],
          ]);
        },
      ),
    },
  },
);
registerArenaHero("lyra", "Lyra", "#68bde7", "Hộ vệ · Thủy Triều", "staff", {
  passive:
    "Đòn trúng tích Thủy Triều, đủ 4 tầng tăng hiệu quả khiên. Sóng và xoáy có lực đẩy hữu hạn.",
  init(f) {
    f.ws.tide = 0;
  },
  onDeal(f) {
    f.ws.tide = Math.min(4, f.ws.tide + 1);
  },
  resource: (f) => `≈ ${f.ws.tide}/4`,
  skills: {
    A: arenaSkill(
      "Bong Bóng Nước",
      0.8,
      "Bong bóng bay thẳng, làm chậm kẻ trúng.",
      (f, m) =>
        arenaBolt(f, m, "A", 5, {
          kind: "sonic",
          r: 12,
          hit: { tag: "A", dmg: 5, kb: 65, kg: 2, slow: [1, 0.25] },
        }),
    ),
    B: arenaSkill(
      "Sóng Dâng",
      4,
      "Sóng rộng đẩy đối thủ theo hướng ngắm.",
      (f, m) =>
        m.hitLine(f, {
          len: 270,
          w: 75,
          angle: f.castAngle,
          dmg: 9,
          kb: 255,
          kg: 6,
          tag: "B",
        }),
    ),
    C: arenaSkill(
      "Dòng Chảy",
      7,
      "Lướt ngắn theo hướng ngắm, nhận khiên và giảm tối đa 8 điểm văng.",
      (f, m) => {
        arenaDash(f, m, 100);
        arenaShield(f, 8);
        f.percent = Math.max(0, f.percent - 8);
      },
    ),
    D: arenaSkill(
      "Giáp Bong Bóng",
      8,
      "Tiêu Thủy Triều để tạo khiên và nổ sóng đẩy quanh thân.",
      (f, m) => {
        arenaShield(f, 6 + f.ws.tide * 2);
        f.ws.tide = 0;
        m.hitCircle(f, { r: 110, dmg: 5, kb: 150, kg: 2, tag: "D" });
      },
    ),
    U: arenaSkill(
      "Đại Hồng Thủy",
      18,
      "Cột nước báo trước, để lại xoáy hút nhẹ trong 4s.",
      (f, m) => {
        const p = arenaPoint(f, m, 200);
        arenaBurst(f, m, "U", p, 145, 17, 230, 0.75, { stun: 0.65 });
        arenaDelayed(f, m, 0.75, () =>
          arenaZone(f, m, p, { r: 145, pull: 1, slow: 0.3, heal: 1 }),
        );
      },
    ),
  },
});

registerArenaHero(
  "ratok",
  "Ratok",
  "#bc9e88",
  "Đỡ đòn · Móc xích",
  "greatsword",
  {
    weight: 1.3,
    speed: 0.93,
    passive:
      "Móc trúng tạo dây xích ngắn hạn. Bấm lại A kéo về, D thả dây để không bị kéo theo.",
    init(f) {
      f.ws.hook = null;
    },
    update(f, m) {
      if (
        f.ws.hook &&
        (!f.ws.hook.target.alive ||
          f.ws.hook.until < m.time ||
          dist(f, f.ws.hook.target) > 500)
      )
        f.ws.hook = null;
    },
    skills: {
      A: arenaSkill(
        "Móc Sắt Rỉ Sét",
        6,
        "Móc thẳng; trúng tướng thì bấm lại A để kéo về.",
        (f, m) =>
          arenaBolt(f, m, "A", 5, {
            kind: "hook",
            range: 380,
            onHit(mm, p, t) {
              f.ws.hook = { target: t, until: mm.time + 2 };
            },
          }),
        {
          recast: (f) => !!f.ws.hook,
          recastUse(f, m) {
            const hook = f.ws.hook;
            f.ws.hook = null;
            if (hook && hook.target.alive && hook.until >= m.time)
              hook.target.pull = { by: f, speed: 500, stop: 50, t: 0.8 };
          },
        },
      ),
      B: arenaSkill(
        "Bộc Phá Húc",
        5,
        "Lao theo hướng ngắm; nếu đang móc thì lao tới nạn nhân.",
        (f, m) => {
          if (f.ws.hook?.target.alive) f.castAngle = angTo(f, f.ws.hook.target);
          arenaDash(f, m, 180, {
            onContact: (e) => {
              m.applyHit(f, e, {
                tag: "B",
                dmg: 10,
                kb: 265,
                kg: 5,
                angle: f.castAngle,
                stun: 0.4,
              });
              return true;
            },
          });
        },
      ),
      C: arenaSkill(
        "Tử Xích Toàn Phong",
        7,
        "Quay xích quanh người, kéo nhẹ và ngắt niệm.",
        (f, m) => {
          for (const e of m.enemiesOf(f))
            if (dist(f, e) < 125)
              m.applyHit(f, e, {
                tag: "C",
                dmg: 6,
                kb: 130,
                kg: 1,
                angle: angTo(e, f),
                stun: 0.3,
              });
        },
      ),
      D: arenaSkill(
        "Thả Xích / Thiết Phá",
        5,
        "Thả móc, nhận Thiết Thân 1s và khiên nhỏ.",
        (f) => {
          f.ws.hook = null;
          f.addStatus("ironbody", 1);
          arenaShield(f, 6);
        },
      ),
      U: arenaSkill(
        "Tàn Phá Thế Giới",
        18,
        "Neo tới điểm đã chọn sau cảnh báo; nổ đẩy văng quanh điểm đáp.",
        (f, m) => {
          const p = arenaPoint(f, m, 250);
          arenaBurst(f, m, "U", p, 135, 20, 300, 0.75);
          arenaDelayed(f, m, 0.75, () => arenaTeleport(f, m, p));
        },
      ),
    },
  },
);
registerArenaHero("kip", "Kip", "#936fed", "Đấu sĩ · Hư Không", "dagger", {
  speed: 1.12,
  passive:
    "Ba Điểm Hư Không hồi dần. Neo chỉ dịch chuyển tới vùng còn đứng được, không cứu một KO đã xác nhận.",
  init(f) {
    f.ws.void = 3;
    f.ws.regen = 0;
    f.ws.anchor = null;
    f.ws.knife = null;
    f.ws.dome = 0;
    f.ws.domain = 0;
  },
  resource: (f) => `◈ ${f.ws.void}/3`,
  update(f, m, dt) {
    f.ws.regen += dt;
    if (f.ws.regen >= 4) {
      f.ws.regen = 0;
      f.ws.void = Math.min(3, f.ws.void + 1);
    }
    f.ws.dome = Math.max(0, f.ws.dome - dt);
    f.ws.domain = Math.max(0, f.ws.domain - dt);
    if (f.ws.domain && dist(f, f.ws.domainPoint) > 250) f.ws.domain = 0;
    if (f.ws.anchor?.until < m.time) f.ws.anchor = null;
    if (f.ws.knife?.until < m.time) f.ws.knife = null;
  },
  onIncoming(f, att, hit) {
    if (f.ws.dome > 0 && hit.proj) return false;
  },
  skills: {
    A: arenaSkill(
      "Phi Đao Tọa Độ",
      3,
      "Phi đao trúng tạo neo trên địch; bấm lại để xuất hiện sau lưng.",
      (f, m) =>
        arenaBolt(f, m, "A", 7, {
          kind: "knife",
          range: 470,
          onHit(mm, p, t) {
            f.ws.knife = { target: t, until: mm.time + 3 };
          },
        }),
      {
        recast: (f) => !!f.ws.knife,
        recastUse(f, m) {
          const k = f.ws.knife;
          f.ws.knife = null;
          if (k?.target.alive && k.until >= m.time) {
            arenaTeleport(f, m, {
              x: k.target.x - Math.cos(k.target.facing) * 55,
              y: k.target.y - Math.sin(k.target.facing) * 55,
            });
            arenaArc(f, m, "A", 85, 8, 140);
          }
        },
      },
    ),
    B: arenaSkill(
      "Xuyên Không Trảm",
      4,
      "Cắt trước mặt, thưởng lực đẩy khi đang trong Lãnh Địa.",
      (f, m) => arenaArc(f, m, "B", 115, 11, f.ws.domain ? 280 : 230),
    ),
    C: arenaSkill(
      "Vết Nứt Hư Không",
      6,
      "Tốn một Điểm Hư Không, dịch chuyển; bấm lại để trở về neo trong 3s.",
      (f, m) => {
        f.ws.anchor = { x: f.x, y: f.y, until: m.time + 3 };
        if (!f.ws.domain) f.ws.void--;
        arenaTeleport(f, m, arenaPoint(f, m, 150));
      },
      {
        can: (f) => f.ws.void > 0 || f.ws.domain > 0,
        recast: (f) => !!f.ws.anchor,
        recastUse(f, m) {
          const p = f.ws.anchor;
          f.ws.anchor = null;
          if (p && p.until >= m.time) arenaTeleport(f, m, p);
        },
      },
    ),
    D: arenaSkill(
      "Vòm Xoáy Bẻ Cong Đạn Đạo",
      8,
      "Tốn một điểm, nuốt đạn đạo trong 1.5s; kết thúc đẩy nhẹ quanh thân.",
      (f, m) => {
        f.ws.void--;
        f.ws.dome = 1.5;
        arenaDelayed(f, m, 1.5, () =>
          m.hitCircle(f, { tag: "D", r: 100, dmg: 5, kb: 180, kg: 2 }),
        );
      },
      { can: (f) => f.ws.void > 0, ai: { type: "def", max: 400 } },
    ),
    U: arenaSkill(
      "Lãnh Địa Đa Chiều",
      20,
      "Lãnh địa 7s. Vết Nứt không tốn điểm; rời vùng sẽ hủy.",
      (f, m) => {
        f.ws.domain = 7;
        f.ws.domainPoint = { x: f.x, y: f.y };
        f.ws.void = 3;
        m.fx({ type: "ring", x: f.x, y: f.y, r: 250, color: f.color, life: 7 });
      },
    ),
  },
});

registerArenaHero(
  "olivia",
  "Olivia",
  "#f5e4a4",
  "Hộ vệ · Thánh Linh",
  "staff",
  {
    passive:
      "Đức Tin hồi chậm tới 100. Hồi phục giảm điểm văng với trần, không tăng stock.",
    init(f) {
      f.ws.faith = 50;
    },
    update(f, m, dt) {
      arenaFaith(f, dt * 4);
    },
    resource: (f) => `✦ ${Math.floor(f.ws.faith)}/100`,
    skills: {
      A: arenaSkill(
        "Dây Dẫn Thánh Linh",
        2,
        "Xích thánh theo hướng ngắm, trói đối thủ.",
        (f, m) =>
          arenaBolt(f, m, "A", 6, {
            kind: "sonic",
            hit: { tag: "A", dmg: 6, kb: 70, kg: 2, root: 1 },
          }),
      ),
      B: arenaSkill(
        "Trận Pháp Cứu Rỗi",
        5,
        "Thánh trận có báo trước, đẩy nhẹ và làm chậm.",
        (f, m) =>
          arenaBurst(f, m, "B", arenaPoint(f, m, 180), 95, 9, 200, 0.65, {
            slow: [1, 0.35],
          }),
      ),
      C: arenaSkill(
        "Thánh Hộ Thể",
        7,
        "Tiêu 20 Đức Tin, tạo khiên 12 điểm, thanh tẩy.",
        (f) => {
          f.ws.faith -= 20;
          f.cleanse();
          arenaShield(f, 12);
        },
        { can: (f) => f.ws.faith >= 20, ai: { type: "def", max: 1000 } },
      ),
      D: arenaSkill(
        "Ý Chí Thần Quan",
        8,
        "Cầu nguyện 1.2s, đòn đánh ngắt hồi phục. Giảm tối đa 10 điểm văng.",
        (f) => {
          const hurt = f.lastHurtT;
          f.act(1.3, { move: 0 }, [
            [
              1.2,
              () => {
                if (f.lastHurtT === hurt) {
                  f.percent = Math.max(0, f.percent - 10);
                  arenaFaith(f, 15);
                }
              },
            ],
          ]);
        },
        { ai: { type: "buff", max: 1000 } },
      ),
      U: arenaSkill(
        "Thánh Linh Ban Phước",
        20,
        "Giảm 15 điểm văng và nhận khiên; sóng ánh sáng đẩy kẻ địch gần.",
        (f, m) => {
          f.percent = Math.max(0, f.percent - 15);
          arenaShield(f, 14, 4);
          m.hitCircle(f, { tag: "U", r: 160, dmg: 10, kb: 245, kg: 4 });
        },
      ),
    },
  },
);
registerArenaHero(
  "justus",
  "Justus",
  "#ead7ff",
  "Pháp sư · Thánh Đình",
  "staff",
  {
    passive:
      "Đức Tin dùng cho thanh tẩy và laser. Tia liên tục bị ngắt khi trúng khống chế.",
    init(f) {
      f.ws.faith = 60;
    },
    update(f, m, dt) {
      arenaFaith(f, dt * 3);
    },
    onDeal: (f) => arenaFaith(f, 3),
    resource: (f) => `✦ ${Math.floor(f.ws.faith)}/100`,
    skills: {
      A: arenaSkill(
        "Tam Kiếm Trừng Phạt",
        1.6,
        "Ba kiếm rơi tại các điểm theo hướng ngắm sau 0.3s.",
        (f, m) => {
          for (let i = 1; i <= 3; i++)
            arenaBurst(
              f,
              m,
              "A",
              arenaPoint(f, m, i * 70),
              32,
              3,
              50,
              0.3 + i * 0.06,
              { stun: 0.15 },
            );
        },
      ),
      B: arenaSkill(
        "Tia Phán Quyết Liên Tục",
        6,
        "Tiêu 20 Đức Tin, giữ hướng tia trong 1.5s; khống chế sẽ ngắt.",
        (f, m) => {
          f.ws.faith -= 20;
          const a = f.castAngle;
          f.act(
            1.6,
            { move: 0.3, anim: "shoot" },
            [0.2, 0.5, 0.8, 1.1, 1.4].map((t) => [
              t,
              () =>
                m.hitLine(f, {
                  len: 340,
                  w: 28,
                  angle: a,
                  dmg: 3,
                  kb: 75,
                  kg: 2,
                  tag: "B",
                }),
            ]),
          );
        },
        { can: (f) => f.ws.faith >= 20 },
      ),
      C: arenaSkill(
        "Thánh Quang Hộ Thể",
        7,
        "Khiên thánh chặn điểm văng và lực đẩy một phần.",
        (f) => arenaShield(f, 13),
      ),
      D: arenaSkill(
        "Thanh Tẩy Kiên Định",
        10,
        "Tiêu 25 Đức Tin, xóa khống chế và nhận tăng tốc ngắn.",
        (f) => {
          f.ws.faith -= 25;
          f.cleanse();
          f.addStatus("haste", 2, 0.2);
        },
        {
          can: (f) => f.ws.faith >= 25,
          breakCC: true,
          ai: { type: "def", max: 1000 },
        },
      ),
      U: arenaSkill(
        "Trận Địa Thanh Tẩy",
        20,
        "Vùng thánh 5s, thiêu địch và hồi phục nhẹ khi đứng trong vùng.",
        (f, m) => {
          arenaShield(f, 10);
          arenaZone(
            f,
            m,
            { x: f.x, y: f.y },
            { r: 190, life: 5, dmg: 3, slow: 0.2, heal: 1 },
          );
        },
      ),
    },
  },
);

registerArenaHero(
  "mirage",
  "Mirage",
  "#c89af0",
  "Biến ảo · Hoán vị",
  "dagger",
  {
    passive:
      "Ảo ảnh có ID và chủ sở hữu, tối đa ba. Đổi chỗ không hoạt động nếu đã KO.",
    init(f) {
      f.ws.knife = null;
    },
    skills: {
      A: arenaSkill(
        "Tàn Ảnh Lướt Xuyên",
        1.4,
        "Lướt ngắn và chém trước mặt.",
        (f, m) => {
          arenaDash(f, m, 80);
          arenaArc(f, m, "A", 90, 6, 90);
        },
      ),
      B: arenaSkill(
        "Phi Dao Hoán Vị",
        5,
        "Phi dao gắn dấu 3s; bấm lại đổi chỗ với nạn nhân còn sống.",
        (f, m) =>
          arenaBolt(f, m, "B", 7, {
            kind: "knife",
            onHit(mm, p, t) {
              f.ws.knife = { target: t, until: mm.time + 3 };
            },
          }),
        {
          recast: (f) => !!f.ws.knife,
          recastUse(f, m) {
            const k = f.ws.knife;
            f.ws.knife = null;
            if (!k || !k.target.alive || k.until < m.time) return;
            const p = { x: f.x, y: f.y };
            if (arenaTeleport(f, m, k.target)) arenaTeleport(k.target, m, p);
          },
        },
      ),
      C: arenaSkill(
        "Hộp Tử Thần",
        9,
        "Hộp cảnh báo 1.6s, nổ mạnh tại điểm đã chọn.",
        (f, m) =>
          arenaBurst(f, m, "C", arenaPoint(f, m, 210), 145, 19, 300, 1.6, {
            stun: 0.7,
          }),
      ),
      D: arenaSkill(
        "Biến Ảnh / Phân Hình",
        8,
        "Không có ảnh: tạo ảnh. Có ảnh: đổi vị trí với ảnh còn sống.",
        (f, m) => {
          const echo = m.minions.find(
            (e) => e.owner === f && e.kind === "arena_echo" && e.alive,
          );
          if (echo) {
            const p = { x: f.x, y: f.y };
            if (arenaTeleport(f, m, echo)) arenaTeleport(echo, m, p);
          } else arenaEcho(f, m, 7);
        },
      ),
      U: arenaSkill(
        "Phân Thân Hoàn Hảo",
        20,
        "Phân thân 10s có thể bắn và ném Hộp Tử Thần thu nhỏ; bấm D để đổi chỗ.",
        (f, m) => {
          const echo = arenaEcho(f, m, 10, 0.6);
          for (const delay of [2, 5, 8])
            arenaDelayed(f, m, delay, () => {
              if (echo.alive)
                arenaBurst(
                  f,
                  m,
                  "U",
                  { x: echo.x, y: echo.y },
                  85,
                  7,
                  160,
                  0.8,
                );
            });
        },
      ),
    },
  },
);
registerArenaHero(
  "dahlia",
  "Dahlia",
  "#a65bd7",
  "Biến ảo · Sân khấu",
  "staff",
  {
    passive:
      "Ảo ảnh tự đánh theo luật vật triệu hồi; không bao giờ thay controller của người chơi.",
    init(f) {
      f.ws.counter = 0;
      f.ws.stage = 0;
    },
    update(f, m, dt) {
      f.ws.counter = Math.max(0, f.ws.counter - dt);
      f.ws.stage = Math.max(0, f.ws.stage - dt);
    },
    onIncoming(f, att, hit, m) {
      if (f.ws.counter > 0 && !att.isEnv) {
        f.ws.counter = 0;
        arenaTeleport(f, m, arenaPoint(f, m, 90));
        att.addStatus("stun", 0.5);
        return false;
      }
    },
    skills: {
      A: arenaSkill(
        "Đôi Ảnh Quấy Nhiễu",
        5,
        "Hai ảo ảnh bắn quấy nhiễu, tối đa ba ảnh trên sân.",
        (f, m) => {
          arenaEcho(f, m, 5);
          arenaEcho(f, m, 5);
        },
      ),
      B: arenaSkill(
        "Mũ Đen Phản Kích",
        7,
        "Thế phản kích 1.2s, chặn một đòn rồi thoát theo hướng ngắm.",
        (f) => {
          f.ws.counter = 1.2;
        },
      ),
      C: arenaSkill(
        "Thoát Nguy / Hư Ảnh Bước",
        4,
        "Đổi chỗ với ảnh gần nhất; trong Sân Khấu được lướt và nổ bóng tối.",
        (f, m) => {
          const echo = m.minions.find((e) => e.owner === f && e.alive);
          if (echo) {
            const p = { x: f.x, y: f.y };
            if (arenaTeleport(f, m, echo)) arenaTeleport(echo, m, p);
          } else arenaTeleport(f, m, arenaPoint(f, m, 90));
          if (f.ws.stage)
            m.hitCircle(f, { tag: "C", r: 80, dmg: 6, kb: 140, kg: 2 });
          f.addStatus("invis", 0.7);
        },
      ),
      D: arenaSkill(
        "Điều Lệnh Ảo Ảnh",
        5,
        "Đưa ảnh về gần, thêm một ảnh khi đang trong Sân Khấu.",
        (f, m) => {
          for (const echo of m.minions.filter((e) => e.owner === f))
            arenaTeleport(echo, m, {
              x: f.x + rand(-65, 65),
              y: f.y + rand(-65, 65),
            });
          if (f.ws.stage) arenaEcho(f, m, 5);
        },
      ),
      U: arenaSkill(
        "Sân Khấu Chết Chóc",
        20,
        "Vũ đài 9s, thêm ảnh và vùng gây áp lực; rời vùng không điều khiển đối thủ.",
        (f, m) => {
          f.ws.stage = 9;
          arenaEcho(f, m, 9);
          arenaZone(
            f,
            m,
            { x: f.x, y: f.y },
            { r: 220, life: 9, dmg: 2, slow: 0.2 },
          );
        },
      ),
    },
  },
);
function lucaSwitch(f, id) {
  if (!id) {
    f.weapon = WEAPONS.arena_luca;
    f.form = null;
    return;
  }
  const copy = WEAPONS["luca_copy_" + id];
  if (!copy) return;
  const target = WEAPONS[ROSTER_BY_ID[id].weapon];
  if (f.ws.copyInitializedId !== id) {
    target.init?.(f);
    f.ws.copyInitializedId = id;
  }
  f.weapon = copy;
  f.form = "luca_copy_" + id;
}
registerArenaHero("luca", "Luca", "#e887ba", "Đấu sĩ · Cải trang", "staff", {
  passive:
    "Cải trang sao chép A/B/C và hình vũ khí; D đổi bộ, giữ cooldown riêng. Không sao chép stock hay controller.",
  init(f) {
    f.ws.copyId = null;
    f.ws.copyUntil = 0;
    f.ws.stageUntil = 0;
    f.ws.anchor = null;
  },
  update(f, m, dt) {
    if (f.ws.otherCd)
      for (const key in f.ws.otherCd)
        f.ws.otherCd[key] = Math.max(0, f.ws.otherCd[key] - dt);
    if (f.ws.copyUntil && m.time > f.ws.copyUntil) {
      f.ws.copyUntil = 0;
      f.ws.copyId = null;
      f.ws.copyInitializedId = null;
      lucaSwitch(f, null);
    }
  },
  skills: {
    A: arenaSkill(
      "Sân Khấu / Bước Nhảy Ngàn Hoa",
      1,
      "Trong Sân Khấu 5s có thể lướt chém liên tiếp.",
      (f, m) => {
        if (!f.ws.stageUntil || f.ws.stageUntil < m.time)
          f.ws.stageUntil = m.time + 5;
        arenaDash(f, m, 65);
        arenaArc(f, m, "A", 80, 5, 90);
      },
    ),
    B: arenaSkill(
      "Ánh Đèn Rọi Vào Tôi Nè!",
      6,
      "Đỡ một đòn bằng thế thủ và tạo cơ hội phản công.",
      (f) => {
        f.addStatus("parry", 1);
        arenaShield(f, 6, 1);
      },
    ),
    C: arenaSkill(
      "Hoán Vị Ảnh Hồng",
      6,
      "Lướt đặt neo hoa; dùng lại để quay về trong 4s.",
      (f, m) => {
        f.ws.anchor = { x: f.x, y: f.y, until: m.time + 4 };
        arenaDash(f, m, 140);
      },
      {
        recast: (f) => !!f.ws.anchor,
        recastUse(f, m) {
          const p = f.ws.anchor;
          f.ws.anchor = null;
          if (p && p.until >= m.time) arenaTeleport(f, m, p);
        },
      },
    ),
    D: arenaSkill(
      "Hoán Đổi Bộ Chiêu",
      2,
      "Khi cải trang, đổi giữa bộ gốc và bộ đang sao chép.",
      (f) => {
        if (!f.ws.copyId) return;
        const cd = { ...f.cd };
        f.cd = { ...(f.ws.otherCd || { A: 0, B: 0, C: 0, D: 0, U: 0, E: 0 }) };
        f.cd.U = Math.max(f.cd.U || 0, cd.U || 0);
        f.ws.otherCd = cd;
        if (f.form) lucaSwitch(f, null);
        else lucaSwitch(f, f.ws.copyId);
      },
    ),
    U: arenaSkill(
      "Cải Trang Tuyệt Đỉnh",
      22,
      "Lá bài trúng tướng cho phép sao chép A/B/C trong 10s.",
      (f, m) =>
        arenaBolt(f, m, "U", 8, {
          kind: "mark",
          onHit(mm, p, t) {
            if (!t.isMinion && t.charId !== "luca") {
              f.ws.copyId = t.charId;
              f.ws.copyUntil = mm.time + 10;
              f.ws.otherCd = { ...f.cd };
              lucaSwitch(f, t.charId);
            }
          },
        }),
      { can: (f) => !f.ws.copyId },
    ),
  },
});

registerArenaHero(
  "caelus",
  "Dr. Caelus",
  "#80d4f1",
  "Pháp sư · Tua ngược",
  "staff",
  {
    passive:
      "Ghi 3.5s lịch sử vị trí, vận tốc và điểm văng. Tua ngược không phục hồi stock hoặc hồi sinh.",
    init(f) {
      f.ws.history = [];
      f.ws.mark = null;
      f.ws.reflect = 0;
    },
    update(f, m, dt) {
      f.ws.reflect = Math.max(0, f.ws.reflect - dt);
      f.ws.history.push({
        time: m.time,
        units: m.fighters.map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          vx: e.vx,
          vy: e.vy,
          percent: e.percent,
          stocks: e.stocks,
          epoch: e.lifeEpoch,
        })),
      });
      if (f.ws.history.length > 215) f.ws.history.shift();
    },
    onIncoming(f, att, hit) {
      if (f.ws.reflect > 0 && hit.proj) {
        arenaShield(f, Math.min(6, hit.dmg || 0));
        return false;
      }
    },
    skills: {
      A: arenaSkill(
        "Ma Trận Khóa Tọa Độ",
        5,
        "Ma trận có báo trước, trói và chặn lướt trong vùng trúng.",
        (f, m) => {
          const p = arenaPoint(f, m, 230);
          arenaBurst(f, m, "A", p, 100, 7, 90, 0.6, { root: 1 });
          arenaDelayed(f, m, 0.6, () => {
            for (const e of m.enemiesOf(f))
              if (dist(e, p) < 100) e.addStatus("nodash", 2);
          });
        },
      ),
      B: arenaSkill(
        "Tia Laser Phân Rã",
        5,
        "Laser tụ lực theo hướng ngắm, xuyên cột.",
        (f, m) => {
          const a = f.castAngle;
          f.act(0.6, { move: 0.3, charge: 0.4 }, [
            [
              0.4,
              () =>
                m.hitLine(f, {
                  tag: "B",
                  len: 510,
                  w: 35,
                  angle: a,
                  dmg: 13,
                  kb: 255,
                  kg: 5,
                }),
            ],
          ]);
        },
      ),
      C: arenaSkill(
        "Phản Xạ Lượng Tử",
        7,
        "Chắn đạn trong 1.5s, dùng lại xả sóng đẩy quanh người.",
        (f, m) => {
          if (f.ws.reflect) {
            f.ws.reflect = 0;
            m.hitCircle(f, { tag: "C", r: 120, dmg: 6, kb: 200, kg: 3 });
          } else f.ws.reflect = 1.5;
        },
        {
          recast: (f) => f.ws.reflect > 0,
          recastUse(f, m) {
            f.ws.reflect = 0;
            m.hitCircle(f, { tag: "C", r: 120, dmg: 6, kb: 200, kg: 3 });
          },
        },
      ),
      D: arenaSkill(
        "Chốt Mục Tiêu Nghịch Đảo",
        1,
        "Ngắm trúng kẻ địch để đánh dấu; không có mục tiêu thì chọn chính mình.",
        (f, m) => {
          f.ws.mark = m.autoTarget(f, 550)?.id || f.id;
          m.text(f.x, f.y - 55, "Đã chốt mục tiêu", "#80d4f1", 14);
        },
      ),
      U: arenaSkill(
        "Nghịch Đảo Dữ Liệu Thời Không",
        20,
        "Tua vị trí, vận tốc và % của mục tiêu về 3.5s trước, chỉ trong cùng một mạng.",
        (f, m) => {
          const target = m.fighters.find((e) => e.id === (f.ws.mark || f.id));
          const old = f.ws.history
            .find((h) => h.time >= m.time - 3.5)
            ?.units.find((e) => e.id === target?.id);
          if (
            target?.alive &&
            old &&
            target.stocks === old.stocks &&
            target.lifeEpoch === old.epoch
          ) {
            target.action = null;
            if (arenaTeleport(target, m, old)) {
              target.vx = old.vx;
              target.vy = old.vy;
              target.percent = old.percent;
            }
          }
        },
        { can: (f) => f.ws.history.length >= 210 },
      ),
    },
  },
);
registerArenaHero(
  "bachdiep",
  "Bạch Diệp",
  "#c9edff",
  "Pháp sư · Phi kiếm",
  "greatsword",
  {
    passive:
      "Phi kiếm trúng tích tối đa 30 Kiếm. D chọn một trong ba thế chiêu cuối; luôn giới hạn số đạn.",
    init(f) {
      f.ws.swords = 0;
      f.ws.stance = 0;
    },
    resource: (f) => `⚔ ${f.ws.swords}/30 · Thế ${f.ws.stance + 1}`,
    onDeal(f) {
      f.ws.swords = Math.min(30, f.ws.swords + 1);
    },
    skills: {
      A: arenaSkill(
        "Kiếm Vũ: Loạn Trảm",
        0.45,
        "Số phi kiếm tăng theo Kiếm Khí, tối đa bảy kiếm một loạt.",
        (f, m) => {
          const n = Math.min(7, 1 + Math.floor(f.ws.swords / 5));
          for (let i = 0; i < n; i++)
            arenaBolt(f, m, "A", 3, {
              kind: "knife",
              angle: f.castAngle + (i - (n - 1) / 2) * 0.08,
            });
        },
      ),
      B: arenaSkill(
        "Kiếm Trận Vạn Cổ",
        6,
        "Trận phi kiếm tại điểm ngắm, nổ chậm rồi tạo vùng ép góc.",
        (f, m) => {
          const p = arenaPoint(f, m, 190);
          arenaBurst(f, m, "B", p, 110, 10, 225, 0.55);
          arenaDelayed(f, m, 0.55, () =>
            arenaZone(f, m, p, { r: 110, life: 2, dmg: 2 }),
          );
        },
      ),
      C: arenaSkill(
        "Kiếm Hộ Pháp",
        7,
        "Lướt theo hướng ngắm và tạo khiên theo Kiếm Khí.",
        (f, m) => {
          arenaDash(f, m, 100);
          arenaShield(f, Math.min(14, 5 + f.ws.swords / 4));
        },
      ),
      D: arenaSkill(
        "Chọn Thế Kiếm",
        1,
        "Luân phiên: Lục Tinh → Phong Ấn → Thăng Hoa. Người chơi tự chọn.",
        (f, m) => {
          f.ws.stance = (f.ws.stance + 1) % 3;
          m.text(
            f.x,
            f.y - 55,
            ["Lục Tinh", "Phong Ấn", "Thăng Hoa"][f.ws.stance],
            f.color,
            16,
          );
        },
      ),
      U: arenaSkill(
        "Thiên Kiếm Trận",
        20,
        "Lục Tinh: nổ lớn; Phong Ấn: giam bằng vòng; Thăng Hoa: tăng sức mạnh và Kiếm Khí.",
        (f, m) => {
          if (f.ws.stance === 0)
            arenaBurst(f, m, "U", arenaPoint(f, m, 180), 170, 22, 320, 0.8);
          else if (f.ws.stance === 1) {
            m.rings.push({ x: f.x, y: f.y, r: 210, t: 5, owner: f });
            arenaZone(f, m, { x: f.x, y: f.y }, { r: 210, life: 5, dmg: 3 });
          } else {
            f.ws.swords = Math.min(30, f.ws.swords + 10);
            f.addStatus("empower", 6, 0.3);
            f.addStatus("haste", 6, 0.2);
          }
        },
      ),
    },
  },
);
registerArenaHero(
  "tsukiyo",
  "Tsukiyo",
  "#ad9ae2",
  "Nhẫn giả · Tam Đại Nhẫn Thuật",
  "katana",
  {
    speed: 1.12,
    passive:
      "D tự đổi ba nhẫn thuật: Pháp, Kiếm, Phong. Đổi hệ không xóa cooldown; không AI tự chọn bộ chiêu.",
    init(f) {
      f.ws.school = 0;
      f.ws.counter = 0;
    },
    resource: (f) => ["🔮 Pháp", "⚔ Kiếm", "🌪 Phong"][f.ws.school],
    update(f, m, dt) {
      f.ws.counter = Math.max(0, f.ws.counter - dt);
    },
    onIncoming(f, att, hit, m) {
      if (f.ws.counter > 0 && !hit.reflected && !att.isEnv) {
        f.ws.counter = 0;
        if (hit.proj)
          arenaBolt(f, m, "C", 6, {
            angle: angTo(f, att),
            hit: { tag: "C", dmg: 6, kb: 130, kg: 3, reflected: true },
          });
        else att.addStatus("stun", 0.6);
        return false;
      }
    },
    skills: {
      A: arenaSkill(
        "Nhẫn Thuật Nhất",
        1,
        "Pháp: hỏa cầu; Kiếm: loạt phi tiêu; Phong: Thuấn Trảm.",
        (f, m) => {
          if (f.ws.school === 0)
            arenaBolt(f, m, "A", 8, {
              kind: "fireball",
              r: 12,
              hit: { tag: "A", dmg: 8, kb: 110, kg: 3, burn: [2, 1] },
            });
          else if (f.ws.school === 1)
            for (const off of [-0.15, 0, 0.15])
              arenaBolt(f, m, "A", 4, {
                kind: "knife",
                angle: f.castAngle + off,
              });
          else {
            arenaDash(f, m, 95);
            arenaArc(f, m, "A", 85, 7, 110);
          }
        },
      ),
      B: arenaSkill(
        "Nhẫn Thuật Nhị",
        5,
        "Pháp: bẫy trói; Kiếm: ba nhát; Phong: song nhận hất văng.",
        (f, m) => {
          if (f.ws.school === 0) {
            const p = { x: f.x, y: f.y };
            arenaDash(f, m, 90);
            arenaBurst(f, m, "B", p, 85, 10, 150, 0.6, { root: 1 });
          } else if (f.ws.school === 1)
            f.act(
              0.6,
              { move: 0.3, anim: "swing" },
              [0.1, 0.25, 0.45].map((t) => [
                t,
                () => arenaArc(f, m, "B", 100, 4, 140),
              ]),
            );
          else arenaArc(f, m, "B", 145, 12, 265, { trueDmg: true });
        },
      ),
      C: arenaSkill(
        "Nhẫn Thuật Tam",
        7,
        "Pháp: thế thân; Kiếm: khói ẩn; Phong: phản đòn/đạn một lần.",
        (f, m) => {
          if (f.ws.school === 0) {
            arenaTeleport(f, m, arenaPoint(f, m, 150));
            arenaEcho(f, m, 3);
          } else if (f.ws.school === 1) {
            f.addStatus("invis", 2);
            arenaZone(
              f,
              m,
              { x: f.x, y: f.y },
              { r: 95, life: 3, dmg: 0, slow: 0.25 },
            );
          } else f.ws.counter = 1.5;
        },
      ),
      D: arenaSkill(
        "Chuyển Nhẫn Thuật",
        1.5,
        "Chủ động chuyển hệ, giữ nguyên cooldown A/B/C.",
        (f, m) => {
          f.ws.school = (f.ws.school + 1) % 3;
          m.text(
            f.x,
            f.y - 55,
            ["Pháp", "Kiếm", "Phong"][f.ws.school],
            f.color,
            18,
          );
        },
      ),
      U: arenaSkill(
        "Nhẫn Thuật Tối Thượng",
        22,
        "Pháp: Hắc Nguyệt chậm nổ; Kiếm: Huyền Ảnh tăng sức mạnh; Phong: hai phân thân.",
        (f, m) => {
          if (f.ws.school === 0)
            arenaBurst(f, m, "U", arenaPoint(f, m, 210), 175, 24, 330, 1.2, {
              stun: 0.8,
            });
          else if (f.ws.school === 1) {
            f.addStatus("empower", 6, 0.4);
            f.addStatus("haste", 6, 0.3);
          } else {
            arenaEcho(f, m, 9, 0.5);
            arenaEcho(f, m, 9, 0.5);
          }
        },
      ),
    },
  },
);

// Finite, declared copy forms let remote renderers resolve the same skill names without code in snapshots.
for (const hero of ROSTER)
  if (hero.id !== "luca") {
    const target = WEAPONS[hero.weapon],
      base = WEAPONS.arena_luca;
    WEAPONS["luca_copy_" + hero.id] = {
      ...base,
      name: "Luca · " + hero.name,
      gfx: target.gfx,
      skills: {
        ...base.skills,
        A: target.skills.A,
        B: target.skills.B,
        C: target.skills.C,
      },
      update(f, m, dt) {
        base.update(f, m, dt);
        if (f.form) target.update?.(f, m, dt);
      },
    };
  }
