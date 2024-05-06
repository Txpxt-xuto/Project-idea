#include <stdio.h>
int main()//มงกุฏ//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<n;i++)
    {
        for(j=0;j<=i;j++) printf("*");
        for(j=2*(n-i);j>1;j--) printf(" ");
        for(j=0;j<2*i+1;j++) printf("*");
        for(j=2*(n-i);j>1;j--) printf(" ");
        for(j=0;j<=i;j++) printf("*");
        printf("\n");
    }
    for(i=0;i<n;i++)
    {
        for(j=0;j<4*n+1;j++) printf("*");
        printf("\n");
    }
}