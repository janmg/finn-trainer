import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ClassData {
  id: string;
  name: string;
  studentsText: string;
  students: string[];
}

@Component({
  selector: 'app-tools-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tools-page.component.html',
  styleUrl: './tools-page.component.css'
})
export class ToolsPageComponent implements OnInit {
  classes: ClassData[] = [
    {
      id: 'class-1',
      name: 'Luokka 1',
      studentsText: 'Matti\nMaija\nVille\nAino\nEero\nSofia\nJuho\nEmma',
      students: ['Matti', 'Maija', 'Ville', 'Aino', 'Eero', 'Sofia', 'Juho', 'Emma']
    }
  ];

  selectedClassId = 'class-1';
  showEditClassModal = false;
  editingStudentsText = '';

  activeTab: 'groups' | 'queue' | 'seating' | 'wheel' = 'groups';

  // Group generator settings & result
  groupSize = 3;
  generatedGroups: string[][] = [];

  // Queue generator result
  generatedQueue: string[] = [];

  // Seating plan settings & result
  seatsPerRow = 4;
  generatedSeating: string[][] = [];

  // Wheel state
  wheelItemsText = '';
  wheelItems: string[] = [];
  selectedWheelItem: string | null = null;
  isSpinning = false;
  wheelRotation = 0;

  ngOnInit(): void {
    this.updateClassStudents();
  }

  get currentClass(): ClassData | undefined {
    return this.classes.find((c) => c.id === this.selectedClassId);
  }

  get currentStudents(): string[] {
    return this.currentClass?.students || [];
  }

  openEditClassModal(): void {
    if (this.currentClass) {
      this.editingStudentsText = this.currentClass.studentsText;
      this.showEditClassModal = true;
    }
  }

  closeEditClassModal(): void {
    this.showEditClassModal = false;
  }

  saveClassStudents(): void {
    if (this.currentClass) {
      this.currentClass.studentsText = this.editingStudentsText;
      this.updateClassStudents();
    }
    this.showEditClassModal = false;
  }

  updateClassStudents(): void {
    if (this.currentClass) {
      this.currentClass.students = this.currentClass.studentsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      this.wheelItemsText = this.currentClass.students.join('\n');
      this.wheelItems = [...this.currentClass.students];
    }
  }

  addClass(): void {
    const newId = `class-${Date.now()}`;
    const newName = `Luokka ${this.classes.length + 1}`;
    const newClass: ClassData = {
      id: newId,
      name: newName,
      studentsText: '',
      students: []
    };
    this.classes.push(newClass);
    this.selectedClassId = newId;
    this.openEditClassModal();
  }

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  generateGroups(): void {
    const students = this.shuffle(this.currentStudents);
    if (!students.length) return;

    const size = Math.max(1, this.groupSize);
    const groups: string[][] = [];
    for (let i = 0; i < students.length; i += size) {
      groups.push(students.slice(i, i + size));
    }
    this.generatedGroups = groups;
  }

  generateQueue(): void {
    this.generatedQueue = this.shuffle(this.currentStudents);
  }

  generateSeating(): void {
    const students = this.shuffle(this.currentStudents);
    if (!students.length) return;

    const cols = Math.max(1, this.seatsPerRow);
    const grid: string[][] = [];
    for (let i = 0; i < students.length; i += cols) {
      grid.push(students.slice(i, i + cols));
    }
    this.generatedSeating = grid;
  }

  updateWheelItems(): void {
    this.wheelItems = this.wheelItemsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  spinWheel(): void {
    this.updateWheelItems();
    if (!this.wheelItems.length || this.isSpinning) return;

    this.isSpinning = true;
    this.selectedWheelItem = null;

    const chosenIndex = Math.floor(Math.random() * this.wheelItems.length);
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const degreesPerItem = 360 / this.wheelItems.length;
    // Align so selected item ends up at top (270 deg / -90 deg offset)
    const targetDeg = extraTurns * 360 + (360 - chosenIndex * degreesPerItem - degreesPerItem / 2);

    this.wheelRotation += targetDeg;

    setTimeout(() => {
      this.isSpinning = false;
      this.selectedWheelItem = this.wheelItems[chosenIndex];
    }, 3000);
  }
}
