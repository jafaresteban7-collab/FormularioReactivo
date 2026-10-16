import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrivenPage } from './driven.page';

describe('DrivenPage', () => {
  let component: DrivenPage;
  let fixture: ComponentFixture<DrivenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DrivenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
