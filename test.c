#include <stdio.h>

struct Stack{
    int *arr;
    int top;
};

void initializeStack(struct Stack *s, int size){
    s->arr=(int *)malloc(size*sizeof(int));
    s->top=-1;
}

void push(struct Stack *s, int data){
    s->top++;
    s->arr[s->top]=data;
}

int pop(struct Stack *s) {
    if (s->top == -1) {
        printf("Stack underflow\n");
        return -1;
    } else {
        int element = s->arr[s->top];
        s->top--;
        return element;
    }
}

int main(){
    struct Stack s;
    initializeStack(&s, 10);
    return 0;
}