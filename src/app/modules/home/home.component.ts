import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Game } from '../../models/game.model';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  games: Game[] = [
    {
      title: 'cs2',
      banner: 'assets/images/cs2-banner.webp'
    },
    {
      title: 'valorant',
      banner: 'assets/images/valo-banner.jpeg'
    },
    {
      title: 'mlbb',
      banner: 'assets/images/mlbb.webp'
    }
  ]

  players: Player[] = [
    {
      firstName: 'Garidmagnai',
      lastName: 'Byambasuren',
      ign: 'bLitz',
      role: 'In-game Leader',
      image: 'assets/images/blitz.webp'
    },
    {
      firstName: 'Sodbayar',
      lastName: 'Munkhbold',
      ign: 'Techno',
      role: 'Entry-Fragger',
      image: 'assets/images/techno.webp'
    },
    {
      firstName: 'Munkhbold',
      lastName: 'Azbayar',
      ign: 'Senzu',
      role: 'Entry-Fragger',
      image: 'assets/images/senzu.webp'
    },
    {
      firstName: 'Ayush',
      lastName: 'Batbold',
      ign: 'mzinho',
      role: 'Lurker',
      image: 'assets/images/mzinho.webp'
    },
    {
      firstName: 'Usukhbayar',
      lastName: 'Banzragch',
      ign: '910',
      role: 'AWPer',
      image: 'assets/images/910.webp'
    },
    {
      firstName: 'Erdenedalai',
      lastName: 'Bayanbat',
      ign: 'maaRaa',
      role: 'Coach',
      image: 'assets/images/maaraa.webp'
    }
  ]

  constructor() {}
}
