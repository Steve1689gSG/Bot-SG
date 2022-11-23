const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow
const armorManager = require('mineflayer-armor-manager')
const autoeat = require('mineflayer-auto-eat')
const collectBlock = require('mineflayer-collectblock').plugin
const bot = mineflayer.createBot({
  host: "айпи",
  port: порт,
  username: 'ник',
})



bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)
bot.loadPlugin(autoeat)
bot.loadPlugin(collectBlock)

bot.on('spawn', () => {
  bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 10,
    bannedFood: []
  }
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea(pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding() {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos() {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})

bot.on('physicTick', () => {
  if (!guardPos) return

  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
    e.mobType !== 'Armor Stand'

  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})

bot.on('chat', (username, message) => {
  if (username === 'ник свой') {
    const mcData = require('minecraft-data')(bot.version)
    const args = message.split(' ')
    if (args[0] == 'собери') {


      const blockType = mcData.blocksByName[args[1]]
      if (!blockType) {
        bot.chat("я не знаю такого блока")
        return
      }


      const block = bot.findBlock({
        matching: blockType.id,
        maxDistance: 64
      })

      if (!block) {
        bot.chat("я не вижу таких поблизости")
        return
      }

      bot.chat('собираю ближний ' + blockType.name)


      bot.collectBlock.collect(block, err => {
        if (err) bot.chat(err.message)
      })
    }

    if (message === 'охраняй') {
      const player = bot.players[username]

      if (!player) {
        bot.chat("я не могу тебя найти")
        return
      }

      bot.chat('я буду защищать эту локацию')
      guardArea(player.entity.position)
    }

    if (message.indexOf('пиши ') !== -1) {
      var replacement = "пиши ",
        toReplace = "",
        str = message

      str = str.replace(replacement, toReplace)
      bot.chat(str)
    }
    if (message.indexOf('ходи ') !== -1) {
      var replacement = "ходи ",
        toReplace = "",
        str = message

      str = str.replace(replacement, toReplace)
      const player = bot.players[str]

      if (!player) {
        bot.chat("я не могу найти")
        return
      }

      const goal = new GoalFollow(player.entity, 1)
      bot.pathfinder.setGoal(goal, true)
    }

    if (message.indexOf('дерись ') !== -1) {
      var replacement = "дерись ",
        toReplace = "",
        str = message

      str = str.replace(replacement, toReplace)
      const player = bot.players[str]

      if (!player) {
        bot.chat("я не могу тебя найти")
        return
      }

      bot.chat('готовлюсь к битве я уже готова')
      bot.pvp.attack(player.entity)
    }

    if (message === 'стоп') {
      bot.chat('я больше не что не делаю')
      stopGuarding()
    }
    if (message.indexOf('найди ') !== -1) {
      var replacement = "найди ",
        toReplace = "",
        str = message

      str = str.replace(replacement, toReplace)
      const player = bot.players[str]

      if (!player) {
        bot.chat("я не могу найти тебя")
        return
      }

      const goal = new GoalFollow(player.entity, 1)
      bot.pathfinder.setGoal(goal, true)
    }
    if (message === "порыбачь") {
      const rod = bot.inventory.items().find(item => item.name.includes('rod'))
      if (rod) bot.equip(rod, 'hand')
      bot.fish()
    }
    if (message === "за мной") {
      bot.chat('я хажу за табой')
      const player = bot.players[username]
      bot.pathfinder.setGoal(new GoalFollow(player.entity, 1), true)
    }
    if (message === "ка мне") {
      bot.chat('щя подадайду')
      const player = bot.players[username]
      bot.pathfinder.setGoal(new GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1))
    }
    if (message === 'выкинь') {
      bot.chat('щя выкину')
      function tossNext() {
        if (bot.inventory.items().length === 0)
          return
        const item = bot.inventory.items()[0]
        bot.tossStack(item, tossNext)
      }
      tossNext()
    }
  }
})

bot.on('message', (json) => {
  console.log(json.toAnsi())
})
bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
bot.on('error', err => console.log(err))
