import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Maze } from '../models/maze';
import './js/PathFinding.js'
import './js/raphael-min.js';
import './js/state-machine.min.js';
import './js/controller.js';
import './js/view.js';
import './js/main.js';

@Component({
  selector: 'app-maze',
  templateUrl: './maze.component.html',
  styleUrls: ['./maze.component.css']
})
export class MazeComponent implements OnInit, AfterViewInit {

  title = 'Tower maze';
  length = 20;
  private maze: Maze;
  private canvas: HTMLCanvasElement;

  options: FormGroup;

  constructor(fb: FormBuilder) { 
    this.options = fb.group({
      rows: 20,
      columns: 7
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.canvas = <HTMLCanvasElement>document.getElementById('maze');
    this.drawMaze();
  }

  drawMaze() {
    let rows = this.options.get('rows').value;
    let columns = this.options.get('columns').value;
    this.maze = new Maze(rows, columns);
    this.canvas.width = columns * this.length;
    this.canvas.height = rows * this.length;
    this.maze.draw(this.canvas, this.length);
  }

  drawPath() {
    this.maze.drawPath(this.canvas, this.length);
  }
}
